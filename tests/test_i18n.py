import csv
import unittest

from crs import i18n, load


class TranslationTest(unittest.TestCase):
    def test_every_occupation_has_indonesian_title_and_description(self):
        d = load()
        for code, title, description in zip(d.codes, d.titles, d.descriptions):
            self.assertNotEqual(i18n.occupation_description(code, description), description, code)
            self.assertTrue(i18n.occupation_title(code, title), code)
        titles = [i18n.occupation_title(c, t) for c, t in zip(d.codes, d.titles)]
        self.assertEqual(len(set(titles)), len(titles))   # students must be able to tell them apart

    def test_translation_file_matches_the_onet_titles(self):
        d = load()
        with open(i18n.HERE / "pekerjaan.csv", encoding="utf-8") as f:
            rows = {r["kode"]: r["judul_en"] for r in csv.DictReader(f)}
        self.assertEqual(rows, dict(zip(d.codes, d.titles)))

    def test_every_competency_is_translated(self):
        for _, name in load().competencies:
            self.assertNotEqual(i18n.competency(name), "", name)
        self.assertEqual(i18n.competency("Critical Thinking"), "Berpikir Kritis")
        self.assertEqual(i18n.competency("Not A Competency"), "Not A Competency")



if __name__ == "__main__":
    unittest.main()
