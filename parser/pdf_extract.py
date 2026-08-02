"""Read raw table rows out of the DHET register PDF, tagging each with the
registration-status section it falls under."""

import re

import pdfplumber

_REGISTERED_RE = re.compile(r"REGISTERED INSTITUTIONS", re.IGNORECASE)
_PROVISIONAL_RE = re.compile(r"PROVISIONALLY REGISTERED", re.IGNORECASE)

# Sections 4-6 of the register (institutions whose registration lapsed/was
# cancelled/discontinued, and a free-text warning list of unregistered
# "bogus colleges") use table schemas incompatible with the 6-column
# NAME/ADDRESS/REG-NO/PROVINCE/QUALIFICATIONS layout of sections 1-2, and
# their row-numbering ("1. Some College ...") doesn't start a new record for
# `grouping.group_table_rows`. Left unfiltered, their rows get silently
# merged as "continuations" onto the last real institution parsed before
# them. Since the pipeline only targets Registered/Provisionally Registered
# institutions, these sections are excluded outright rather than parsed.
_EXCLUDED_SECTION_RE = re.compile(
    r"CANCELLATION OR LAPSE OF REGISTRATION|DISCONTINUE THEIR REGISTRATION|BOGUS COLLEGES|ILLEGAL COLLEGES",
    re.IGNORECASE,
)

EXCLUDED = "Excluded"


def detect_status_header(row):
    """If `row` is a section-header row (e.g. "1. REGISTERED INSTITUTIONS"),
    return the status string it announces; otherwise None."""
    joined = " ".join((cell or "") for cell in row)
    if _EXCLUDED_SECTION_RE.search(joined):
        return EXCLUDED
    if _PROVISIONAL_RE.search(joined):
        return "Provisionally Registered"
    if _REGISTERED_RE.search(joined):
        return "Registered"
    return None


def iter_status_rows(pdf_path):
    """Yield (status, row) tuples for every table row across the whole PDF,
    in document order, carrying forward whichever status section header was
    most recently seen. Section-header rows themselves are not yielded, and
    rows under an excluded section are dropped entirely so they can never be
    merged as a "continuation" of a preceding, unrelated institution."""
    status = None
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                for row in table:
                    header_status = detect_status_header(row)
                    if header_status:
                        status = header_status
                        continue
                    if status == EXCLUDED:
                        continue
                    yield status, row
