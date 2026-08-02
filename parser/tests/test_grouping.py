"""Tests for merging raw pdfplumber table rows into per-institution records.

Fixture rows below are copied verbatim from `extract_tables()` output on
pages 7-9 of the real DHET register (institutions #1 AAA School of
Advertising, spanning a page break, and #2 Academy for Facility Management).
"""

from grouping import group_table_rows

HEADER_ROWS = [
    ("Registered", ["", "", ""]),
    ("Registered", [None, "1. REGISTERED INSTITUTIONS", None]),
    ("Registered", [None, "", None]),
    ("Registered", ["", "NAME", "SITES OF DELIVERY", "REGISTRATIO\nN NO.", "PROVINCE", "QUALIFICATONS"]),
]

ROW_INSTITUTION_1_START = (
    "Registered",
    [
        "1.",
        "AAA School of Advertising\n(Pty) Ltd\nCONTACT PERSON:\nDr Muni Kooblal\nAcademic Registrar",
        "A) Bryanston: The Braes\nOffice Park, 3 Eaton\nAvenue, Bryanston, 2191",
        "2000/HE07/015",
        "Gauteng",
        "1) Higher Certificate in Digital Marketing (NQF\nlevel 5, 120-Credits: Distance Mode) [A]\n"
        "2) Higher Certificate in Marketing Communication\n(HEQSF Aligned, NQF Level 5, 120-\nCredits: Contact Mode) [A, B]",
    ],
)

ROW_INSTITUTION_1_CONTINUATION = (
    "Registered",
    [
        "",
        "031 307 7170 (F)\nWebsite:\nwww.aaaschool.co.za\nEmail Address:\nmkooblal@richfield.ac.za\nPrivate Bag X23\nUmhlanga Rocks\n4320",
        "B) Cape Town: 6thFloor,\nAAA House, 112 Long\nStreet, Cape Town, 8001.",
        "",
        "",
        "3) Higher Certificate in Visual Communications\n(HEQSF Aligned, NQF Level 5, 120-\nCredits: Contact Mode) [A, B]",
    ],
)

ROW_INSTITUTION_2_START = (
    "Registered",
    [
        "2.",
        "Academy for Facility\nManagement (Pty) Ltd (A4FM)\nCONTACT PERSON:\nMrs M Dimas\nAcademic Administrator\n"
        "(012) 993 0533(T)\nWebsite:\nwww.a4fm.ac.za\nEmail Address:\nadmin@a4fm.ac.za\njge@a4fm.ac.za",
        "A) Pretoria: 374 Cliff\nAvenue, Waterkloof Ridge\nX2, Pretoria, 0181.",
        "2009/HE07/012",
        "Gauteng",
        "1) Higher Certificate in Facilities Management\n(HEQSF aligned, NQF Level 5, 120-Credits:\nDistance Mode)",
    ],
)


def test_skips_decorative_and_header_rows():
    records = group_table_rows(HEADER_ROWS)
    assert records == []


def test_groups_single_row_institution_with_no_continuation():
    records = group_table_rows([ROW_INSTITUTION_2_START])
    assert len(records) == 1
    assert records[0]["index"] == "2."
    assert records[0]["registration_number"] == "2009/HE07/012"
    assert records[0]["province"] == "Gauteng"
    assert records[0]["status"] == "Registered"


def test_merges_continuation_row_into_prior_record():
    records = group_table_rows([ROW_INSTITUTION_1_START, ROW_INSTITUTION_1_CONTINUATION])
    assert len(records) == 1
    record = records[0]
    assert record["index"] == "1."
    assert "AAA School of Advertising" in record["name_block"]
    assert "031 307 7170 (F)" in record["name_block"]
    assert "A) Bryanston" in record["address_block"]
    assert "B) Cape Town" in record["address_block"]
    assert record["registration_number"] == "2000/HE07/015"
    assert record["province"] == "Gauteng"
    assert "1) Higher Certificate in Digital Marketing" in record["qualifications_block"]
    assert "3) Higher Certificate in Visual Communications" in record["qualifications_block"]


def test_new_index_row_starts_a_new_record():
    records = group_table_rows([ROW_INSTITUTION_1_START, ROW_INSTITUTION_1_CONTINUATION, ROW_INSTITUTION_2_START])
    assert len(records) == 2
    assert records[0]["index"] == "1."
    assert records[1]["index"] == "2."


def test_header_rows_interleaved_with_data_are_ignored():
    rows = HEADER_ROWS + [ROW_INSTITUTION_1_START, ROW_INSTITUTION_1_CONTINUATION]
    records = group_table_rows(rows)
    assert len(records) == 1
    assert records[0]["index"] == "1."


def test_continuation_row_before_any_start_row_is_dropped():
    records = group_table_rows([ROW_INSTITUTION_1_CONTINUATION])
    assert records == []


def test_status_tag_carried_from_start_row():
    provisional_row = (
        "Provisionally Registered",
        [
            "1.",
            "Academic Institute of Excellence\n(Pty) Ltd",
            "A) Midrand: Main Campus",
            "2022/HE07/005",
            "Gauteng",
            "1) Higher Certificate in Architectural Technology",
        ],
    )
    records = group_table_rows([provisional_row])
    assert records[0]["status"] == "Provisionally Registered"
