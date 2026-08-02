"""Integration test against the cached real DHET register PDF (fixtures/).

This exercises the full pipeline (pdf_extract -> grouping -> build) end to
end against real, messy government-document data rather than hand-crafted
fixtures, to catch structural surprises the unit tests can't.
"""

import os

import pytest

from build import record_to_institution
from grouping import group_table_rows
from pdf_extract import iter_status_rows

FIXTURE_PDF = os.path.join(os.path.dirname(__file__), "..", "fixtures", "annexure_a_sample.pdf")

pytestmark = pytest.mark.skipif(not os.path.exists(FIXTURE_PDF), reason="sample PDF fixture not present")


def test_first_registered_institution_parses_correctly():
    records = group_table_rows(iter_status_rows(FIXTURE_PDF))
    first = records[0]
    assert first["status"] == "Registered"
    assert first["registration_number"] == "2000/HE07/015"

    inst = record_to_institution(first)
    assert inst.name == "AAA School of Advertising (Pty) Ltd"
    assert inst.province == "Gauteng"


def test_both_status_sections_are_present_in_reasonable_numbers():
    records = group_table_rows(iter_status_rows(FIXTURE_PDF))
    statuses = [r["status"] for r in records]
    assert statuses.count("Registered") > 50
    assert statuses.count("Provisionally Registered") > 50


def test_pipeline_never_crashes_and_produces_institutions_for_most_rows():
    records = group_table_rows(iter_status_rows(FIXTURE_PDF))
    institutions = [record_to_institution(r) for r in records]
    parsed = [i for i in institutions if i is not None]
    assert len(parsed) > 0.8 * len(records)


def test_excluded_sections_never_leak_into_output_or_pollute_prior_record():
    """Regression test: section 6 ("WARNING: ILLEGAL COLLEGES ALSO KNOWN AS
    BOGUS COLLEGES") has no registration numbers and its rows don't start a
    new grouped record, so they used to get merged as a "continuation" onto
    whatever real institution was parsed right before that section -
    inflating its qualifications list with dozens of unrelated entries."""
    records = group_table_rows(iter_status_rows(FIXTURE_PDF))
    assert all(r["status"] != "Excluded" for r in records)

    all_text = "\n".join(r["name_block"] + r["qualifications_block"] for r in records).lower()
    for bogus_marker in ["wordinaction", "alkawtharcentre", "barkley university", "fargo university"]:
        assert bogus_marker not in all_text
