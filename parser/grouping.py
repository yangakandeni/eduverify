"""Merge raw pdfplumber table rows into one dict per institution.

The DHET register table wraps a single institution's data across multiple
physical table rows (and often across a page break) whenever a cell's
content is too long for one row. A new institution starts only when the
leading index column ("1.", "2.", ...) is populated; every other row is a
continuation that must be appended to the most recently started record.
"""

import re

_NEW_RECORD_RE = re.compile(r"^\d+\.$")
_COLUMN_KEYS = [None, "name_block", "address_block", "registration_number", "province", "qualifications_block"]


def _cell(value):
    return (value or "").strip()


def _is_noise_row(row):
    if len(row) != 6:
        return True
    if _cell(row[1]).upper() == "NAME":
        return True
    if all(_cell(c) == "" for c in row):
        return True
    return False


def group_table_rows(status_rows):
    """status_rows: iterable of (status, row) tuples, row being the 6-column
    list pdfplumber's extract_tables() returns. Returns a list of dicts, one
    per institution, with keys: index, status, name_block, address_block,
    registration_number, province, qualifications_block."""
    records = []
    current = None
    for status, row in status_rows:
        if _is_noise_row(row):
            continue
        if _NEW_RECORD_RE.match(_cell(row[0])):
            if current:
                records.append(current)
            current = {"index": _cell(row[0]), "status": status}
            for col_idx, key in enumerate(_COLUMN_KEYS):
                if key:
                    current[key] = _cell(row[col_idx])
        else:
            if current is None:
                continue
            for col_idx, key in enumerate(_COLUMN_KEYS):
                if not key:
                    continue
                extra = _cell(row[col_idx])
                if extra:
                    current[key] = f"{current[key]}\n{extra}" if current[key] else extra
    if current:
        records.append(current)
    return records
