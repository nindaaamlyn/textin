"""Run with:  .venv/bin/python -m unittest discover tests"""
import unittest

import numpy as np

from crs import RIASEC, Recommender


class RecommenderTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rec = Recommender()
        cls.data = cls.rec.data

    def test_data_is_complete(self):
        d = self.data
        self.assertEqual(len(d.codes), 878)
        self.assertEqual(len(d.areas), 41)
        self.assertEqual(d.riasec.shape, (878, 6))
        self.assertFalse(np.isnan(d.level).any())
        self.assertEqual(set(d.job_zones), {2, 3, 4, 5})

    def test_fit_is_the_pearson_correlation(self):
        student = {"Realistic": 2, "Investigative": 9, "Artistic": 4, "Social": 5, "Enterprising": 1, "Conventional": 6}
        fit = self.rec.interest_fit(student)
        self.assertEqual(fit.shape, (878,))
        for i in (0, 100, 877):
            expected = np.corrcoef([student[t] for t in RIASEC], self.data.riasec[i])[0, 1]
            self.assertAlmostEqual(fit[i], expected)

    def test_own_profile_fits_perfectly(self):
        i = self.data.index_of("Physicists")
        fit = self.rec.interest_fit(dict(zip(RIASEC, self.data.riasec[i])))
        self.assertAlmostEqual(fit[i], 1.0)
        self.assertEqual(fit.max(), fit[i])

    def test_riasec_scale_does_not_matter(self):
        a = {"Realistic": 2, "Investigative": 9, "Artistic": 4, "Social": 5, "Enterprising": 1, "Conventional": 6}
        b = {k: v * 4 + 3 for k, v in a.items()}
        np.testing.assert_allclose(self.rec.interest_fit(a), self.rec.interest_fit(b))

    def test_competencies_use_the_level_scale(self):
        found = {c.name: c for c in self.rec.competencies("Physicists", limit=200)}
        self.assertAlmostEqual(found["Mathematical Reasoning"].required, 6.0 / 7)   # Level 6.00 on a 0..7 scale
        self.assertTrue(all(c.importance >= 3 for c in found.values()))
        ordered = [c.importance for c in self.rec.competencies("Physicists")]
        self.assertEqual(ordered, sorted(ordered, reverse=True))
        self.assertEqual(len(ordered), 10)

    def test_incomplete_scores_are_rejected(self):
        with self.assertRaises(ValueError):
            self.rec.interest_fit({"Realistic": 1})

    def test_quality_on_synthetic_students(self):
        """Regression guard: a noisy copy of an occupation's interests should find that occupation
        again, and its primary Related Occupations well above chance (1.1%)."""
        d, rng = self.data, np.random.default_rng(0)
        R = np.clip((d.riasec - 1) / 6 + rng.normal(0, 0.10, d.riasec.shape), 0, 1)
        hits, recalls = [], []
        for i in range(len(d.codes)):
            fit = self.rec.interest_fit(dict(zip(RIASEC, R[i])))
            hits.append((fit > fit[i]).sum() < 10)
            primary = set(d.related.get(i, [])[:10])
            fit[i] = -np.inf
            if primary:
                recalls.append(len(primary & set(np.argsort(-fit)[:10])) / len(primary))
        print(f"\n  siswa sintetis: Hit@10 {np.mean(hits):.1%}, Related Recall@10 {np.mean(recalls):.1%}")
        self.assertGreater(np.mean(hits), 0.60)
        self.assertGreater(np.mean(recalls), 0.15)


if __name__ == "__main__":
    unittest.main()
