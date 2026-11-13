"""Tests for service-level recommendation rules."""
import unittest

import numpy as np

from crs.service import ranked_occupation_indices


class RecommendationRankingTest(unittest.TestCase):
    def test_only_positive_correlations_are_eligible(self):
        fit = np.array([0.4, 0.0, -0.3, 1e-14, np.nan, 0.2])
        codes = ["10-0001.00", "10-0002.00", "10-0003.00", "10-0004.00", "10-0005.00", "10-0006.00"]
        zones = [2, 2, 2, 2, 2, 2]
        self.assertEqual(ranked_occupation_indices(fit, codes, zones), [0, 5])

    def test_ties_are_broken_by_occupation_code(self):
        fit = np.array([0.5, 0.5, 0.8, 0.5])
        codes = ["10-0004.00", "10-0002.00", "10-0003.00", "10-0001.00"]
        zones = [2, 2, 2, 2]
        self.assertEqual(ranked_occupation_indices(fit, codes, zones), [2, 3, 1, 0])

    def test_job_zone_filter_is_applied_before_ranking(self):
        fit = np.array([0.9, 0.8, 0.7, -0.2])
        codes = ["10-0001.00", "10-0002.00", "10-0003.00", "10-0004.00"]
        zones = [5, 3, 2, 2]
        self.assertEqual(ranked_occupation_indices(fit, codes, zones, max_job_zone=3), [1, 2])

    def test_mismatched_arrays_are_rejected(self):
        with self.assertRaises(ValueError):
            ranked_occupation_indices([0.5], ["10-0001.00", "10-0002.00"], [2])


if __name__ == "__main__":
    unittest.main()
