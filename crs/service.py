"""What the application shows and stores, independent of the user interface.

Used by the FastAPI app (web/app.py).
"""
import csv
import io
from functools import lru_cache

import numpy as np

from . import details, i18n, questionnaire
from .data import JOB_ZONE_NAMES, RIASEC
from .recommender import Recommender, fit_label

RIASEC_LABELS = {"Realistic": "Realistis", "Investigative": "Investigatif", "Artistic": "Artistik",
                 "Social": "Sosial", "Enterprising": "Enterprising", "Conventional": "Konvensional"}
# Short everyday names for the six interest types, shown next to the Indonesian label.
RIASEC_NICKNAMES = {"Realistic": "Praktis", "Investigative": "Analitis", "Artistic": "Kreatif",
                    "Social": "Membantu Orang", "Enterprising": "Kepemimpinan", "Conventional": "Teratur"}
ITEM_PROMPT = ("Bayangkan kamu melakukan kegiatan berikut sebagai pekerjaan. "
               "Seberapa suka kamu melakukannya?")
ITEMS_PER_TYPE = 10
MAX_TYPE_SCORE = 40   # ten items, each answered 0..4
EDUCATION_PLANS = {
    "Belum tahu / tampilkan semua": None,
    "Lulus SMA/SMK lalu bekerja atau pelatihan singkat": 2,
    "Sampai D3 atau pelatihan vokasi": 3,
    "Sampai S1": 4,
    "Sampai S2/S3": 5,
}
ATTRIBUTION = (
    "Aplikasi ini memuat informasi dari O*NET 31.0 Database dan O*NET Career Exploration Tools oleh "
    "U.S. Department of Labor, Employment and Training Administration (USDOL/ETA), digunakan di bawah "
    "lisensi CC BY 4.0 dan O*NET Tools Developer License. O*NET® adalah merek dagang USDOL/ETA. "
    "Pengembang aplikasi ini telah mengubah sebagian informasi tersebut. USDOL/ETA tidak menyetujui, "
    "mendukung, atau menguji perubahan ini."
)

@lru_cache(maxsize=1)
def recommender():
    return Recommender()


def title(i):
    d = recommender().data
    return i18n.occupation_title(d.codes[i], d.titles[i])


def card(i):
    """What a result card shows for occupation row i."""
    rec = recommender()
    d = rec.data
    zone = int(d.job_zones[i])
    return {
        "code": d.codes[i], "title": title(i), "title_en": d.titles[i],
        "description": i18n.occupation_description(d.codes[i], d.descriptions[i]),
        "job_zone": zone, "job_zone_name": JOB_ZONE_NAMES[zone],
    }


def occupation_detail(code):
    """Everything the detail view shows, or None for an unknown code."""
    rec = recommender()
    d = rec.data
    if code not in d.codes:
        return None
    i = d.codes.index(code)
    detail = card(i)
    detail["skills"] = [{"name": i18n.competency(g.name), "importance": round(g.importance, 2),
                         "level": round(g.required * 7, 1)} for g in rec.competencies(i, limit=10)]
    detail["related"] = [{"code": d.codes[j], "title": title(j), "job_zone": int(d.job_zones[j])}
                         for j in d.related.get(i, [])[:10]]
    detail["education"] = [{"label": label, "percent": percent} for label, percent in details.education(code)]
    detail["work_styles"] = details.work_styles(code)
    detail["software"] = details.software(code)
    return detail


# ---------------------------------------------------------------- RIASEC questionnaire + Pearson
def type_label(riasec_type):
    return f"{RIASEC_LABELS[riasec_type]} ({RIASEC_NICKNAMES[riasec_type]})"


def interest_profile(totals):
    """[(type, label, percent)] from RIASEC totals (0..40 each), strongest first."""
    rows = [(t, type_label(t), round(100 * totals[t] / MAX_TYPE_SCORE)) for t in RIASEC]
    return sorted(rows, key=lambda r: -r[2])


def match_percent(correlation):
    """"Kecocokan" shown to the student: the Pearson correlation between the student's six RIASEC
    scores and the occupation's, as a percentage; negative correlations count as 0."""
    return max(0, round(100 * float(correlation)))


def recommend_by_interest(totals, max_job_zone=None, top_n=10):
    """Content-based filtering: rank occupations by Pearson correlation with the student's RIASEC
    scores (the method O*NET's own Interest Profiler uses). Returns result cards with a match."""
    rec = recommender()
    d = rec.data
    fit = rec.interest_fit(totals)
    order = [i for i in np.argsort(-fit) if max_job_zone is None or d.job_zones[i] <= max_job_zone]
    cards = []
    for i in order[:top_n]:
        c = card(int(i))
        c["correlation"] = round(float(fit[i]), 3)
        c["match"] = match_percent(fit[i])
        c["fit_label"] = fit_label(fit[i])
        cards.append(c)
    return cards


def why_it_fits(totals, code):
    """Plain statements for the "Mengapa cocok" tab, plus both RIASEC profiles as percentages."""
    d = recommender().data
    i = d.codes.index(code)
    student = {t: round(100 * totals[t] / MAX_TYPE_SCORE) for t in RIASEC}
    job = {t: round(100 * (d.riasec[i, k] - 1) / 6) for k, t in enumerate(RIASEC)}
    job_top = [RIASEC[k] for k in np.argsort(-d.riasec[i])[:3]]
    student_top = [t for t, _, _ in interest_profile(totals)[:3]]
    shared = [t for t in job_top if t in student_top and student[t] >= 50]
    reasons = [f"Minat {type_label(t)} kamu tinggi ({student[t]}%), dan pekerjaan ini juga menonjol di tipe itu."
               for t in shared]
    if not shared:
        reasons.append("Pola minatmu secara keseluruhan mirip dengan pola minat pekerjaan ini, "
                       "walaupun tipe teratasnya tidak sama.")
    areas = [questionnaire.AREA_LABELS[d.areas[j]] for j in np.argsort(-d.area_scores[i])[:3]]
    reasons.append("Bidang yang paling kuat di pekerjaan ini: " + ", ".join(areas) + ".")
    profile = [{"type": t, "label": type_label(t), "student": student[t], "job": job[t]} for t in RIASEC]
    return reasons, profile


# A few familiar careers for the landing page (O*NET-SOC codes).
SAMPLE_CAREERS = ("15-2051.00", "29-1141.00", "27-1024.00", "17-2051.00", "13-2011.00", "25-2031.00")


def sample_careers():
    codes = recommender().data.codes
    return [card(codes.index(c)) for c in SAMPLE_CAREERS if c in codes]


def career_graph(code, limit=8):
    """The same network as data for a front end that draws it itself: the centre career and the
    careers O*NET lists as related to it, closest first. None for an unknown code."""
    d = recommender().data
    if code not in d.codes:
        return None
    i = d.codes.index(code)
    related = d.related.get(i, [])[:limit]
    return {"centre": {"code": code, "title": title(i)},
            "nodes": [{"code": d.codes[j], "title": title(j), "close": rank < 5,
                       "job_zone_name": JOB_ZONE_NAMES[int(d.job_zones[j])]} for rank, j in enumerate(related)]}


def recommendation(answers, max_job_zone=None, top_n=10):
    """Everything the result pages need from the 60 answers (item number -> 0..4).
    A flat profile (six equal scores) has no correlation with anything, so it gets no cards."""
    try:
        totals = questionnaire.score(answers)
    except ValueError:
        totals = {t: 0 for t in RIASEC}
        for item in questionnaire.items():
            totals[item.riasec] += answers[item.number]
        profile = [{"type": t, "label": label, "percent": percent} for t, label, percent in interest_profile(totals)]
        return {"flat": True, "profile": profile, "cards": []}
    cards = recommend_by_interest(totals, max_job_zone, top_n)
    for c in cards:
        c["reasons"], c["comparison"] = why_it_fits(totals, c["code"])
    profile = [{"type": t, "label": label, "percent": percent} for t, label, percent in interest_profile(totals)]
    return {"flat": False, "profile": profile, "cards": cards}


# ---------------------------------------------------------------- export for the project team
def _to_csv(header, rows):
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(header)
    writer.writerows(rows)
    return out.getvalue()


def export_feedback(store):
    """CSV text with the feedback students gave on their results. No names or emails."""
    rows = [[f["result_id"], f["created_at"], f["summary"]["interest"],
             f["summary"]["top"][0]["title"], f["summary"]["top"][0]["match"],
             f["relevance"], f["ease"], f["comment"]] for f in store.all_result_feedback()]
    return _to_csv(["result_id", "created_at", "strongest_interest", "top1", "top1_match",
                    "relevance", "ease", "comment"], rows)
