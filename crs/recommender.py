"""Career recommendation for high-school students, based on O*NET 31.0.

Content-based filtering on interests: an occupation's fit is the Pearson correlation between the
student's six RIASEC scores and the occupation's RIASEC profile, the method O*NET's own Interest
Profiler uses to link a profile to occupations.

Competencies do not affect the ranking. They are reported per occupation: what the student would
need to develop to get there.
"""
from dataclasses import dataclass

import numpy as np

from .data import RIASEC, OnetData, load

IMPORTANT = 3.0   # O*NET Importance scale: 3 = "Important"
# Cut-offs O*NET's own Interest Profiler uses for the RIASEC profile correlation
# (Gregory & Lewis, 2016, "Linking Client Assessment Profiles to O*NET Occupational Profiles").
BEST_FIT, GREAT_FIT = 0.729, 0.608
LEVEL_MAX = 7.0   # O*NET Level scale runs 0..7


@dataclass
class Competency:
    domain: str
    name: str
    importance: float   # 1..5
    required: float     # the occupation's required level, 0..1


def fit_label(r):
    if r >= BEST_FIT:
        return "Sangat cocok"
    if r >= GREAT_FIT:
        return "Cocok"
    return "Cukup cocok" if r >= 0 else "Kurang cocok"


def _standardise_rows(X):
    """Centre each row and scale it to length 1, so a dot product of two rows is their Pearson correlation."""
    X = X - X.mean(axis=1, keepdims=True)
    norm = np.linalg.norm(X, axis=1, keepdims=True)
    return np.divide(X, norm, out=np.zeros_like(X), where=norm > 0)


class Recommender:
    def __init__(self, data: OnetData | None = None):
        self.data = data or load()
        self._riasec_z = _standardise_rows(self.data.riasec)

    def interest_fit(self, riasec):
        """Pearson correlation (-1..1) between the student's RIASEC scores and every occupation's.
        riasec: {type: score} on any scale."""
        missing = [n for n in RIASEC if n not in riasec]
        if missing:
            raise ValueError(f"Skor RIASEC belum lengkap: {missing}")
        student = _standardise_rows(np.array([[float(riasec[n]) for n in RIASEC]]))[0]
        return self._riasec_z @ student

    def competencies(self, occupation, limit=10):
        """Competencies that are important for the occupation (Importance >= 3), most important first.
        Required level is the O*NET Level scale / 7."""
        d = self.data
        i = occupation if isinstance(occupation, (int, np.integer)) else d.index_of(occupation)
        found = [Competency(domain=dom, name=name, importance=float(d.importance[i, j]),
                            required=float(d.level[i, j]) / LEVEL_MAX)
                 for j, (dom, name) in enumerate(d.competencies) if d.importance[i, j] >= IMPORTANT]
        found.sort(key=lambda c: (-c.importance, -c.required))
        return found[:limit]
