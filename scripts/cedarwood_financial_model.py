from pathlib import Path
import re
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.comments import Comment
from openpyxl.utils import get_column_letter

ROOT = Path("/home/ubuntu/ceff-outreach-app")
OUT_DIR = Path("/home/ubuntu/ceff-deliverables")
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT = OUT_DIR / "Cedarwood_Flats_SKU_Level_Underwriting_Model.xlsx"

SOURCE_FILE = ROOT / "shared" / "cedarwoodHistoricalPlanning.ts"
SOURCE_LABEL = "User-authorized historical planning briefing (pasted_content_21.txt, received 2026-08-21)"
OWNER = "jchappell2120"

DARK_GREEN = "135B44"
LIGHT_GREEN = "CFE9E0"
LIGHT_GRAY = "E7E5E4"
WHITE = "FFFFFF"
BLUE = "0000FF"
BLACK = "000000"
GREEN = "008000"
PURPLE = "800080"
THIN_GRAY = Side(style="thin", color="A6A6A6")
MEDIUM_GREEN = Side(style="medium", color=DARK_GREEN)
CURRENCY = '$#,##0.0;($#,##0.0);-'
PERCENT = '0.0%'
MULTIPLE = '0.0x'
INTEGER = '#,##0;(#,##0);-'


def extract_wbs():
    text = SOURCE_FILE.read_text(encoding="utf-8")
    pattern = re.compile(r'\["([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)", ([0-9_]+)\]')
    rows = []
    for match in pattern.finditer(text):
        desc, category, phase, applicability, amount = match.groups()
        rows.append({
            "wbs_code": f"WBS-{len(rows) + 1:03d}",
            "description": desc,
            "category": category,
            "phase": phase,
            "building": applicability,
            "quantity": 1,
            "unit": "planning_allowance",
            "unit_cost": int(amount.replace("_", "")),
            "amount": int(amount.replace("_", "")),
        })
    if len(rows) != 100:
        raise ValueError(f"Expected 100 Cedarwood WBS rows; found {len(rows)}")
    if sum(row["amount"] for row in rows) != 40_000_000:
        raise ValueError("Cedarwood WBS does not reconcile to $40M")
    return rows


def title(ws, name, subtitle, unit_note="($ in whole dollars unless noted)"):
    ws.sheet_view.showGridLines = False
    ws["C3"] = name
    ws["C3"].fill = PatternFill("solid", fgColor=DARK_GREEN)
    ws["C3"].font = Font(color=WHITE, bold=True, size=16)
    ws["C3"].alignment = Alignment(horizontal="left")
    ws.merge_cells("C3:N3")
    ws["C5"] = subtitle
    ws["C5"].font = Font(bold=True, size=11)
    ws["C6"] = unit_note
    ws["C6"].font = Font(italic=True, color="555555")
    ws.column_dimensions["A"].width = 20
    ws.column_dimensions["B"].width = 20
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.oddFooter.center.text = f"{name} | Page &P of &N"


def section(ws, row, label, end_col=14):
    ws.cell(row=row, column=3, value=label)
    ws.cell(row=row, column=3).fill = PatternFill("solid", fgColor=LIGHT_GREEN)
    ws.cell(row=row, column=3).font = Font(bold=True, color=BLACK)
    ws.merge_cells(start_row=row, start_column=3, end_row=row, end_column=end_col)
    return row + 1


def header(ws, row, labels):
    for col, label in enumerate(labels, 3):
        cell = ws.cell(row=row, column=col, value=label)
        cell.fill = PatternFill("solid", fgColor=LIGHT_GREEN)
        cell.font = Font(bold=True, color=BLACK)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = Border(bottom=THIN_GRAY)
    return row + 1


def input_cell(cell, value, source=None, number_format=None):
    cell.value = value
    cell.font = Font(color=BLUE)
    if number_format:
        cell.number_format = number_format
    if source:
        cell.comment = Comment(source, "Manus AI")


def formula_cell(cell, formula, linked=False, number_format=None):
    cell.value = formula
    cell.font = Font(color=GREEN if linked else BLACK)
    if number_format:
        cell.number_format = number_format


def standard_body(cell, value=None, wrap=False):
    if value is not None:
        cell.value = value
    cell.alignment = Alignment(vertical="top", wrap_text=wrap)


def autotext_widths(ws, max_col=None):
    max_col = max_col or ws.max_column
    for col in range(3, max_col + 1):
        letter = get_column_letter(col)
        max_len = 10
        for row in range(1, min(ws.max_row, 250) + 1):
            value = ws.cell(row=row, column=col).value
            if value is None:
                continue
            text = str(value)
            if text.startswith("="):
                text = "formula"
            max_len = max(max_len, min(len(text) + 2, 40))
        ws.column_dimensions[letter].width = max_len


def build_inputs(wb):
    ws = wb.active
    ws.title = "Inputs - SKU Register"
    title(ws, "Cedarwood Flats | SKU-Level Assumptions & Input Register", "Every number required by the underwriting model is represented below. Blue-font cells are hardcoded planning inputs; blank blue-font cells require entry.")
    row = section(ws, 8, "AUTHORIZED HISTORICAL PLANNING INPUTS AND EDITABLE UNDERWRITING DRIVERS")
    labels = ["SKU", "Input Category", "Driver / Number Required", "Unit", "Historical Planning", "Base Case", "Downside", "Upside", "Input State", "Source / Provenance", "Effective Date", "Owner", "Feeds Schedule", "Notes"]
    row = header(ws, row, labels)
    input_rows = {}

    def add(sku, category, driver, unit, historical=None, base=None, downside=None, upside=None, state="Projected — enter", source="Model input required", effective="", owner=OWNER, feeds="", notes="", fmt=None):
        nonlocal row
        values = [sku, category, driver, unit, historical, base, downside, upside, state, source, effective, owner, feeds, notes]
        for index, value in enumerate(values, 3):
            cell = ws.cell(row=row, column=index)
            if index in (7, 8, 9, 10):
                if value is not None and value != "":
                    input_cell(cell, value, source, fmt)
                else:
                    cell.value = None
                    cell.font = Font(color=BLUE)
                    if fmt:
                        cell.number_format = fmt
            else:
                standard_body(cell, value, wrap=index in (5, 12, 16))
            if index in (7, 8, 9, 10):
                cell.alignment = Alignment(horizontal="right")
        input_rows[sku] = row
        row += 1

    known = SOURCE_LABEL + "; effective date unknown; estimated historical planning context, not actuals or commitments."
    add("PRJ-001", "Project control", "Total development cost control", "USD", 40_000_000, 40_000_000, state="Estimated historical planning base case", source=known, feeds="Summary / WBS / Sources & Uses", notes="Authorized $40M reverse-engineering control case, carried to the working base-case control.", fmt=CURRENCY)
    add("PRJ-002", "Project program", "Total unit count", "units", 280, 280, state="Estimated historical planning base case", source=known, feeds="Rent Roll / Summary", notes="Working program control; unit mix by bedroom type remains an editable planning input.", fmt=INTEGER)
    add("PRJ-003", "Project program", "Building count", "buildings", 5, 5, state="Estimated historical planning base case", source=known, feeds="Summary", notes="Five-building program reference carried to the working base case.", fmt=INTEGER)
    add("PRJ-004", "Project program", "Average SF per unit", "SF / unit", 893, 893, state="Derived historical planning quantity", source=known, feeds="Rent Roll", notes="Derived from 250,000 gross SF / 280 units; planning reference carried to base.", fmt=INTEGER)
    add("PRJ-005", "Cost basis", "Low construction cost basis", "USD / SF", 155, 155, state="Estimated historical planning base case", source=known, feeds="Cost Basis Sensitivity", notes="Supplied historical sensitivity.", fmt=CURRENCY)
    add("PRJ-006", "Cost basis", "Central construction cost basis", "USD / SF", 160, 160, state="Estimated historical planning base case", source=known, feeds="Cost Basis Sensitivity", notes="Supplied historical sensitivity.", fmt=CURRENCY)
    add("PRJ-007", "Cost basis", "High construction cost basis", "USD / SF", 165, 165, state="Estimated historical planning base case", source=known, feeds="Cost Basis Sensitivity", notes="Supplied historical sensitivity.", fmt=CURRENCY)
    add("PRJ-008", "Project program", "Central implied gross SF", "SF", 250_000, 250_000, state="Derived historical planning quantity", source=known, feeds="Summary", notes="$40M / $160 per SF; not a confirmed measurement.", fmt=INTEGER)
    add("PRJ-009", "Operations reference", "Annual NOI reference", "USD / year", 4_750_000, 4_750_000, state="Estimated historical planning base case", source=known, feeds="Summary / Returns", notes="Reference comparison only; never used to back-solve rents.", fmt=CURRENCY)
    add("PRJ-010", "Operations reference", "Historical yield on cost", "%", 0.11875, 0.11875, state="Derived historical planning metric", source=known, feeds="Summary / Returns", notes="$4.75M / $40M; reference metric only.", fmt=PERCENT)
    add("FIN-001", "Financing reference", "Historical financing reference", "USD", 55_000_000, state="Historical planning reference", source=known, feeds="Sources & Uses", notes="Reference only; not funded capital and not applied to the active base case unless copied to a debt input.", fmt=CURRENCY)

    row = section(ws, row + 1, "UNIT MIX AND MARKET RENT SKU INPUTS")
    row = header(ws, row, labels)
    for unit in ["Studio", "One bedroom", "Two bedroom", "Three bedroom"]:
        prefix = unit.replace(" ", "").replace("bedroom", "BR").upper()
        add(f"REV-{prefix}-01", "Unit mix", f"{unit} unit count", "units", feeds="Rent Roll", notes="Enter the planned unit count; all unit-type counts must reconcile to PRJ-002.", fmt=INTEGER)
        add(f"REV-{prefix}-02", "Unit mix", f"{unit} average square feet", "SF / unit", feeds="Rent Roll", notes="Enter planned average unit size.", fmt=INTEGER)
        add(f"REV-{prefix}-03", "Market rent", f"{unit} monthly market rent", "USD / unit / month", feeds="Rent Roll / Revenue", notes="Enter a source-labeled market rent. Do not enter a placeholder as a verified rent.", fmt=CURRENCY)
        add(f"REV-{prefix}-04", "Lease-up", f"{unit} stabilized occupancy", "%", feeds="Rent Roll / Monthly Schedule", notes="Enter stabilized economic occupancy for this unit type.", fmt=PERCENT)
    add("REV-021", "Other income", "Other income per occupied unit per month", "USD / unit / month", feeds="Revenue", notes="Parking, pet, utility, amenity, or other recurring revenue; specify basis in source note.", fmt=CURRENCY)
    add("REV-022", "Revenue leakage", "Concessions and bad debt", "% of GPR", feeds="Revenue", notes="Enter combined or separately sourced revenue leakage.", fmt=PERCENT)
    add("REV-023", "Revenue timing", "Collections lag", "months", feeds="Monthly Schedule", notes="Enter collections timing assumption.", fmt=INTEGER)

    row = section(ws, row + 1, "OPERATING EXPENSE SKU INPUTS")
    row = header(ws, row, labels)
    for idx, name in enumerate(["Real estate taxes", "Property insurance", "Property management", "Payroll and benefits", "Repairs and maintenance", "Utilities", "Contract services", "Marketing and leasing", "General and administrative", "Turnover", "Replacement reserves", "HOA / common-area expense", "Asset management", "Other operating expense"], 1):
        add(f"OPX-{idx:03d}", "Operating expense", name, "USD / year", feeds="Revenue & Operations", notes="Enter annual stabilized amount with source and expense basis.", fmt=CURRENCY)

    row = section(ws, row + 1, "CONSTRUCTION AND LEASE-UP TIMING SKU INPUTS")
    row = header(ws, row, labels)
    for month in range(1, 37):
        add(f"SCH-{month:02d}-01", "Construction timing", f"Month {month} construction deployment", "% of development cost", feeds="Monthly Schedule", notes="All 36 months should reconcile to 100.0% once timing is underwritten.", fmt=PERCENT)
        add(f"SCH-{month:02d}-02", "Lease-up timing", f"Month {month} economic occupancy", "%", feeds="Monthly Schedule", notes="Enter a non-decreasing lease-up curve once timing is underwritten.", fmt=PERCENT)

    row = section(ws, row + 1, "FINANCING, CAPITAL, EXIT, AND RETURN SKU INPUTS")
    row = header(ws, row, labels)
    financing = [
        ("FIN-010", "Senior debt loan amount", "USD", "Debt Schedule", CURRENCY),
        ("FIN-011", "Annual interest rate", "%", "Debt Schedule", PERCENT),
        ("FIN-012", "Financing fee", "% of debt", "Sources & Uses / Debt Schedule", PERCENT),
        ("FIN-013", "Debt term", "months", "Debt Schedule", INTEGER),
        ("FIN-014", "Amortization period", "months", "Debt Schedule", INTEGER),
        ("FIN-015", "Interest-only period", "months", "Debt Schedule", INTEGER),
        ("FIN-016", "Closing / first draw month", "month", "Debt Schedule", INTEGER),
        ("FIN-017", "Construction loan extension fee", "% of debt", "Debt Schedule", PERCENT),
        ("CAP-001", "Sponsor / JV equity contribution", "USD", "Sources & Uses", CURRENCY),
        ("CAP-002", "Other capital sources", "USD", "Sources & Uses", CURRENCY),
        ("EXIT-001", "Exit cap rate", "%", "Returns", PERCENT),
        ("EXIT-002", "Exit sale month", "month", "Returns", INTEGER),
        ("EXIT-003", "Selling costs", "% of gross sale price", "Returns", PERCENT),
        ("RET-001", "Minimum cash reserve", "USD", "Returns", CURRENCY),
    ]
    for sku, driver, unit, feeds, fmt in financing:
        if sku == "FIN-010":
            add(sku, "Capital / financing / exit", driver, unit, base=55_000_000, state="Estimated historical planning base case", source=known, feeds=feeds, notes="Authorized $55M financing reference carried to the working base case. It remains estimated, not funded capital; enter debt terms to activate debt service.", fmt=fmt)
        else:
            add(sku, "Capital / financing / exit", driver, unit, feeds=feeds, notes="Editable underwriting driver. Record value, source, date, owner, and data state when available.", fmt=fmt)

    ws.freeze_panes = "C10"
    ws.auto_filter.ref = f"C9:P{row - 1}"
    return ws, input_rows


def build_wbs(wb, input_rows, wbs):
    ws = wb.create_sheet("WBS Budget")
    title(ws, "Cedarwood Flats | 100-Line Development Budget", "100 reverse-engineered historical planning allocations that reconcile to the authorized $40M control. These are planning entries, not invoices, bids, or commitments.")
    row = section(ws, 8, "DEVELOPMENT BUDGET — 100 SKU-LIKE WBS ENTRIES")
    labels = ["SKU", "Cost Category", "Phase", "Description", "Building Applicability", "Quantity", "Unit", "Unit Cost", "Budget Amount", "% of Total", "Data State", "Source Classification", "Source / Provenance", "Notes"]
    row = header(ws, row, labels)
    start_row = row
    for item in wbs:
        vals = [item["wbs_code"], item["category"], item["phase"], item["description"], item["building"], item["quantity"], item["unit"], item["unit_cost"], item["amount"], None, "Estimated", "Reverse-engineered historical planning allocation", SOURCE_LABEL, "Historical planning allocation; not an actual invoice, bid, commitment, or funded-capital record."]
        for index, value in enumerate(vals, 3):
            cell = ws.cell(row=row, column=index)
            if index in (10, 11):
                input_cell(cell, value, SOURCE_LABEL, CURRENCY if index in (10, 11) else None)
                cell.alignment = Alignment(horizontal="right")
            elif index == 12:
                formula_cell(cell, f"=K{row}/$K$110", number_format=PERCENT)
            else:
                standard_body(cell, value, wrap=index in (6, 7, 15, 16))
        row += 1
    total_row = row
    ws.cell(row=total_row, column=3, value="CHECK-001").font = Font(bold=True)
    ws.cell(row=total_row, column=6, value="Total Development Budget").font = Font(bold=True)
    formula_cell(ws.cell(row=total_row, column=11), f"=SUM(K{start_row}:K{total_row - 1})", number_format=CURRENCY)
    ws.cell(row=total_row, column=11).font = Font(color=BLACK, bold=True)
    ws.cell(row=total_row, column=11).border = Border(top=MEDIUM_GREEN, bottom=Side(style="double", color=DARK_GREEN))
    ws.cell(row=total_row, column=12, value=1).number_format = PERCENT
    ws.cell(row=total_row, column=12).font = Font(color=BLACK, bold=True)
    ws.cell(row=total_row + 1, column=6, value="Reconciliation to $40M control").font = Font(bold=True)
    formula_cell(ws.cell(row=total_row + 1, column=11), f"=K{total_row}-'Inputs - SKU Register'!$G${input_rows['PRJ-001']}", linked=True, number_format=CURRENCY)
    ws.cell(row=total_row + 1, column=16, value="Must equal $0.0 before the planning budget is used as the development-cost control.")
    ws.freeze_panes = "C10"
    ws.auto_filter.ref = f"C9:P{total_row - 1}"
    return ws, total_row


def build_rent_roll(wb, input_rows):
    ws = wb.create_sheet("Rent Roll")
    title(ws, "Cedarwood Flats | Rent Roll & Revenue Drivers", "All market rent, unit mix, and occupancy inputs are editable scenario drivers. The workbook does not back-solve rents from the NOI reference.")
    row = section(ws, 8, "BASE-CASE UNIT MIX AND MARKET RENT DRIVERS")
    labels = ["Unit Type", "Count SKU", "Count", "Average SF SKU", "Average SF", "Rent SKU", "Monthly Rent", "Occupancy SKU", "Occupancy", "Monthly GPR", "Monthly EGI", "Notes"]
    row = header(ws, row, labels)
    records = [("Studio", "STUDIO"), ("One bedroom", "ONEBR"), ("Two bedroom", "TWOBR"), ("Three bedroom", "THREEBR")]
    first = row
    for unit, prefix in records:
        ws.cell(row=row, column=3, value=unit)
        ws.cell(row=row, column=4, value=f"REV-{prefix}-01")
        formula_cell(ws.cell(row=row, column=5), f"=IF('Inputs - SKU Register'!H{input_rows[f'REV-{prefix}-01']}=\"\",\"\",'Inputs - SKU Register'!H{input_rows[f'REV-{prefix}-01']})", linked=True, number_format=INTEGER)
        ws.cell(row=row, column=6, value=f"REV-{prefix}-02")
        formula_cell(ws.cell(row=row, column=7), f"=IF('Inputs - SKU Register'!H{input_rows[f'REV-{prefix}-02']}=\"\",\"\",'Inputs - SKU Register'!H{input_rows[f'REV-{prefix}-02']})", linked=True, number_format=INTEGER)
        ws.cell(row=row, column=8, value=f"REV-{prefix}-03")
        formula_cell(ws.cell(row=row, column=9), f"=IF('Inputs - SKU Register'!H{input_rows[f'REV-{prefix}-03']}=\"\",\"\",'Inputs - SKU Register'!H{input_rows[f'REV-{prefix}-03']})", linked=True, number_format=CURRENCY)
        ws.cell(row=row, column=10, value=f"REV-{prefix}-04")
        formula_cell(ws.cell(row=row, column=11), f"=IF('Inputs - SKU Register'!H{input_rows[f'REV-{prefix}-04']}=\"\",\"\",'Inputs - SKU Register'!H{input_rows[f'REV-{prefix}-04']})", linked=True, number_format=PERCENT)
        formula_cell(ws.cell(row=row, column=12), f'=IF(OR(E{row}=\"\",I{row}=\"\"),\"\",E{row}*I{row})', number_format=CURRENCY)
        formula_cell(ws.cell(row=row, column=13), f'=IF(OR(L{row}=\"\",K{row}=\"\"),\"\",L{row}*K{row})', number_format=CURRENCY)
        ws.cell(row=row, column=14, value="Enter sourced market rent, planned count, average SF, and stabilized occupancy.")
        row += 1
    ws.cell(row=row, column=3, value="Total / weighted output").font = Font(bold=True)
    formula_cell(ws.cell(row=row, column=5), f"=SUM(E{first}:E{row - 1})", number_format=INTEGER)
    formula_cell(ws.cell(row=row, column=12), f'=IF(COUNT(L{first}:L{row - 1})=0,\"\",SUM(L{first}:L{row - 1}))', number_format=CURRENCY)
    formula_cell(ws.cell(row=row, column=13), f'=IF(COUNT(M{first}:M{row - 1})=0,\"\",SUM(M{first}:M{row - 1}))', number_format=CURRENCY)
    ws.cell(row=row + 1, column=3, value="Unit-count check").font = Font(bold=True)
    formula_cell(ws.cell(row=row + 1, column=5), f"=E{row}-'Inputs - SKU Register'!$H${input_rows['PRJ-002']}", linked=True, number_format=INTEGER)
    ws.cell(row=row + 1, column=14, value="Must equal zero before the working unit mix is treated as reconciling to the historical program reference.")
    ws.freeze_panes = "C10"
    return ws


def build_operations(wb, input_rows):
    ws = wb.create_sheet("Revenue & Operations")
    title(ws, "Cedarwood Flats | Operating Statement", "Base-case operating build. All operating inputs are scenario drivers, and blank drivers remain blank rather than being treated as zero.")
    row = section(ws, 8, "STABILIZED ANNUAL OPERATING STATEMENT")
    row = header(ws, row, ["SKU / Line", "Description", "Annual Amount", "Driver Link / Formula", "State", "Notes"])
    start = row
    ws.cell(row=row, column=3, value="REV-100")
    ws.cell(row=row, column=4, value="Gross potential rent")
    formula_cell(ws.cell(row=row, column=5), '=IF(\'Rent Roll\'!L14="","",\'Rent Roll\'!L14*12)', linked=True, number_format=CURRENCY)
    ws.cell(row=row, column=6, value="Rent Roll monthly GPR × 12")
    ws.cell(row=row, column=7, value="Formula")
    ws.cell(row=row, column=8, value="Unavailable until unit mix and market rents are entered.")
    row += 1
    ws.cell(row=row, column=3, value="REV-101")
    ws.cell(row=row, column=4, value="Other income")
    formula_cell(ws.cell(row=row, column=5), f'=IF(OR(\'Rent Roll\'!M14="",\'Inputs - SKU Register\'!H{input_rows["REV-021"]}=""),"",\'Rent Roll\'!M14*\'Inputs - SKU Register\'!H{input_rows["REV-021"]}*12)', linked=True, number_format=CURRENCY)
    ws.cell(row=row, column=6, value="Occupied units × other income per occupied unit × 12")
    ws.cell(row=row, column=7, value="Formula")
    row += 1
    ws.cell(row=row, column=3, value="REV-102")
    ws.cell(row=row, column=4, value="Concessions and bad debt")
    formula_cell(ws.cell(row=row, column=5), f'=IF(OR(E{start}="",\'Inputs - SKU Register\'!H{input_rows["REV-022"]}=""),"",-E{start}*\'Inputs - SKU Register\'!H{input_rows["REV-022"]})', linked=True, number_format=CURRENCY)
    ws.cell(row=row, column=7, value="Formula")
    row += 1
    egi_row = row
    ws.cell(row=row, column=3, value="REV-103")
    ws.cell(row=row, column=4, value="Effective gross income").font = Font(bold=True)
    formula_cell(ws.cell(row=row, column=5), f'=IF(COUNT(E{start}:E{row-1})=0,"",SUM(E{start}:E{row-1}))', number_format=CURRENCY)
    ws.cell(row=row, column=5).font = Font(color=BLACK, bold=True)
    ws.cell(row=row, column=5).border = Border(top=THIN_GRAY)
    ws.cell(row=row, column=7, value="Formula")
    row += 2
    expense_first = row
    for idx, name in enumerate(["Real estate taxes", "Property insurance", "Property management", "Payroll and benefits", "Repairs and maintenance", "Utilities", "Contract services", "Marketing and leasing", "General and administrative", "Turnover", "Replacement reserves", "HOA / common-area expense", "Asset management", "Other operating expense"], 1):
        sku = f"OPX-{idx:03d}"
        ws.cell(row=row, column=3, value=sku)
        ws.cell(row=row, column=4, value=name)
        formula_cell(ws.cell(row=row, column=5), f'=IF(\'Inputs - SKU Register\'!H{input_rows[sku]}="","",-\'Inputs - SKU Register\'!H{input_rows[sku]})', linked=True, number_format=CURRENCY)
        ws.cell(row=row, column=6, value=f"Input SKU {sku}")
        ws.cell(row=row, column=7, value="Projected input")
        row += 1
    noi_row = row
    ws.cell(row=row, column=3, value="NOI-001")
    ws.cell(row=row, column=4, value="Net operating income").font = Font(bold=True)
    formula_cell(ws.cell(row=row, column=5), f'=IF(OR(E{egi_row}="",COUNT(E{expense_first}:E{row-1})=0),"",E{egi_row}+SUM(E{expense_first}:E{row-1}))', number_format=CURRENCY)
    ws.cell(row=row, column=5).font = Font(color=BLACK, bold=True)
    ws.cell(row=row, column=5).border = Border(top=MEDIUM_GREEN, bottom=Side(style="double", color=DARK_GREEN))
    ws.cell(row=row, column=7, value="Formula")
    row += 1
    ws.cell(row=row, column=3, value="NOI-002")
    ws.cell(row=row, column=4, value="Variance to historical NOI reference")
    formula_cell(ws.cell(row=row, column=5), f'=IF(E{noi_row}="","",E{noi_row}-\'Inputs - SKU Register\'!G{input_rows["PRJ-009"]})', linked=True, number_format=CURRENCY)
    ws.cell(row=row, column=7, value="Formula")
    ws.cell(row=row, column=8, value="Reference comparison only. The historical NOI never forces the operating build.")
    ws.freeze_panes = "C10"
    return ws, noi_row


def build_monthly_schedule(wb, input_rows, wbs_total_row):
    ws = wb.create_sheet("Monthly Schedule")
    title(ws, "Cedarwood Flats | 36-Month Construction, Lease-Up & Cash Flow", "Every month has explicit construction and occupancy SKU rows. Blank timing inputs remain blank and prevent modeled cash-flow output.")
    row = section(ws, 8, "BASE-CASE MONTHLY SCHEDULE")
    row = header(ws, row, ["Month", "Phase", "Construction SKU", "Construction %", "Construction Spend", "Occupancy SKU", "Occupancy", "Potential Rent", "EGI", "Operating Expenses", "NOI", "Debt Service", "Levered Cash Flow", "Notes"])
    first = row
    for month in range(1, 37):
        ws.cell(row=row, column=3, value=month)
        ws.cell(row=row, column=4, value="Enter lifecycle phase")
        ws.cell(row=row, column=5, value=f"SCH-{month:02d}-01")
        formula_cell(ws.cell(row=row, column=6), f'=IF(\'Inputs - SKU Register\'!H{input_rows[f"SCH-{month:02d}-01"]}="","",\'Inputs - SKU Register\'!H{input_rows[f"SCH-{month:02d}-01"]})', linked=True, number_format=PERCENT)
        formula_cell(ws.cell(row=row, column=7), f'=IF(F{row}="","",F{row}*\'WBS Budget\'!K{wbs_total_row})', linked=True, number_format=CURRENCY)
        ws.cell(row=row, column=8, value=f"SCH-{month:02d}-02")
        formula_cell(ws.cell(row=row, column=9), f'=IF(\'Inputs - SKU Register\'!H{input_rows[f"SCH-{month:02d}-02"]}="","",\'Inputs - SKU Register\'!H{input_rows[f"SCH-{month:02d}-02"]})', linked=True, number_format=PERCENT)
        formula_cell(ws.cell(row=row, column=10), f'=IF(OR(I{row}="",\'Revenue & Operations\'!E10=""),"",\'Revenue & Operations\'!E10/12*I{row})', linked=True, number_format=CURRENCY)
        formula_cell(ws.cell(row=row, column=11), f'=IF(OR(J{row}="",\'Inputs - SKU Register\'!H{input_rows["REV-021"]}="",\'Inputs - SKU Register\'!H{input_rows["REV-022"]}="",\'Rent Roll\'!E14=""),"",J{row}*(1-\'Inputs - SKU Register\'!H{input_rows["REV-022"]})+(\'Rent Roll\'!E14*I{row}*\'Inputs - SKU Register\'!H{input_rows["REV-021"]}))', linked=True, number_format=CURRENCY)
        formula_cell(ws.cell(row=row, column=12), f'=IF(COUNT(\'Revenue & Operations\'!E15:E28)=0,"",SUM(\'Revenue & Operations\'!E15:E28)/12)', linked=True, number_format=CURRENCY)
        formula_cell(ws.cell(row=row, column=13), f'=IF(OR(K{row}="",L{row}=""),"",K{row}+L{row})', number_format=CURRENCY)
        ws.cell(row=row, column=14, value="")
        formula_cell(ws.cell(row=row, column=15), f'=IF(OR(G{row}="",M{row}=""),"",M{row}-G{row}-N{row})', number_format=CURRENCY)
        ws.cell(row=row, column=16, value="Debt service links once financing terms are entered.")
        row += 1
    total = row
    ws.cell(row=total, column=3, value="CHECK").font = Font(bold=True)
    ws.cell(row=total, column=4, value="36-month totals").font = Font(bold=True)
    formula_cell(ws.cell(row=total, column=7), f'=IF(COUNT(G{first}:G{total-1})=0,"",SUM(G{first}:G{total-1}))', number_format=CURRENCY)
    formula_cell(ws.cell(row=total, column=15), f'=IF(COUNT(O{first}:O{total-1})=0,"",SUM(O{first}:O{total-1}))', number_format=CURRENCY)
    ws.cell(row=total + 1, column=4, value="Construction allocation check").font = Font(bold=True)
    formula_cell(ws.cell(row=total + 1, column=6), f'=IF(COUNT(F{first}:F{total-1})=0,"",SUM(F{first}:F{total-1}))', number_format=PERCENT)
    ws.cell(row=total + 1, column=16, value="Must equal 100.0% after monthly construction timing is entered.")
    ws.freeze_panes = "C10"
    return ws, first, total


def build_sources_uses(wb, input_rows, wbs_total_row):
    ws = wb.create_sheet("Sources & Uses")
    title(ws, "Cedarwood Flats | Sources & Uses", "The $55M financing figure is retained as a historical planning reference. Active sources use only editable base-case debt and equity SKUs.")
    row = section(ws, 8, "USES")
    row = header(ws, row, ["SKU", "Use", "Amount", "Source / Formula", "State", "Notes"])
    ws.cell(row=row, column=3, value="USE-001")
    ws.cell(row=row, column=4, value="Total development budget")
    formula_cell(ws.cell(row=row, column=5), f"='WBS Budget'!K{wbs_total_row}", linked=True, number_format=CURRENCY)
    ws.cell(row=row, column=6, value="WBS Budget total")
    ws.cell(row=row, column=7, value="Historical planning control")
    row += 2
    row = section(ws, row, "SOURCES")
    row = header(ws, row, ["SKU", "Source", "Amount", "Source / Formula", "State", "Notes"])
    source_start = row
    for sku, label in [("FIN-010", "Senior debt"), ("CAP-001", "Sponsor / JV equity"), ("CAP-002", "Other capital sources")]:
        ws.cell(row=row, column=3, value=sku)
        ws.cell(row=row, column=4, value=label)
        formula_cell(ws.cell(row=row, column=5), f'=IF(\'Inputs - SKU Register\'!H{input_rows[sku]}="","",\'Inputs - SKU Register\'!H{input_rows[sku]})', linked=True, number_format=CURRENCY)
        ws.cell(row=row, column=6, value=f"Base-case input SKU {sku}")
        ws.cell(row=row, column=7, value="Projected input")
        row += 1
    source_total = row
    ws.cell(row=row, column=4, value="Total sources").font = Font(bold=True)
    formula_cell(ws.cell(row=row, column=5), f'=IF(COUNT(E{source_start}:E{row-1})=0,"",SUM(E{source_start}:E{row-1}))', number_format=CURRENCY)
    row += 1
    ws.cell(row=row, column=4, value="Sources / uses gap").font = Font(bold=True)
    formula_cell(ws.cell(row=row, column=5), f'=IF(E{source_total}="","",E{source_total}-E10)', number_format=CURRENCY)
    ws.cell(row=row, column=7, value="Formula")
    row += 2
    ws.cell(row=row, column=3, value="FIN-001")
    ws.cell(row=row, column=4, value="Historical financing reference — not applied")
    formula_cell(ws.cell(row=row, column=5), f"='Inputs - SKU Register'!G{input_rows['FIN-001']}", linked=True, number_format=CURRENCY)
    ws.cell(row=row, column=7, value="Historical planning reference")
    ws.cell(row=row, column=8, value="Not funded capital. Copy or modify this reference into FIN-010 only when selecting an active debt case.")
    return ws


def build_debt_returns(wb, input_rows, schedule_first, schedule_total):
    debt = wb.create_sheet("Debt Schedule")
    title(debt, "Cedarwood Flats | Debt Schedule", "Debt service activates only after base-case financing SKU inputs are entered. Historical financing reference remains separate.")
    row = section(debt, 8, "BASE-CASE DEBT TERMS")
    row = header(debt, row, ["SKU", "Term", "Value", "Source", "State", "Notes"])
    for sku, label, fmt in [("FIN-010", "Loan amount", CURRENCY), ("FIN-011", "Annual interest rate", PERCENT), ("FIN-012", "Financing fee", PERCENT), ("FIN-013", "Term", INTEGER), ("FIN-014", "Amortization", INTEGER), ("FIN-015", "Interest-only period", INTEGER), ("FIN-016", "Closing / first draw month", INTEGER), ("FIN-017", "Extension fee", PERCENT)]:
        debt.cell(row=row, column=3, value=sku)
        debt.cell(row=row, column=4, value=label)
        formula_cell(debt.cell(row=row, column=5), f'=IF(\'Inputs - SKU Register\'!H{input_rows[sku]}="","",\'Inputs - SKU Register\'!H{input_rows[sku]})', linked=True, number_format=fmt)
        debt.cell(row=row, column=6, value=f"Base-case SKU {sku}")
        debt.cell(row=row, column=7, value="Projected input")
        row += 1
    row += 1
    row = section(debt, row, "MONTHLY DEBT SERVICE")
    row = header(debt, row, ["Month", "Opening Balance", "Draw", "Interest", "Principal", "Debt Service", "Closing Balance", "Notes"])
    first = row
    for month in range(1, 37):
        debt.cell(row=row, column=3, value=month)
        if month == 1:
            formula_cell(debt.cell(row=row, column=4), '=IF(E10="","",0)', number_format=CURRENCY)
        else:
            formula_cell(debt.cell(row=row, column=4), f'=IF(I{row-1}="","",I{row-1})', number_format=CURRENCY)
        formula_cell(debt.cell(row=row, column=5), f'=IF(OR($E$10="",$E$16=""),"",IF(C{row}=$E$16,$E$10,0))', number_format=CURRENCY)
        formula_cell(debt.cell(row=row, column=6), f'=IF(OR(D{row}="",E{row}="",$E$11=""),"",(D{row}+E{row})*$E$11/12)', number_format=CURRENCY)
        formula_cell(debt.cell(row=row, column=7), f'=IF(OR(D{row}="",$E$14=""),"",IF(C{row}<=$E$14,0,IF($E$13="",0,$E$10/$E$13)))', number_format=CURRENCY)
        formula_cell(debt.cell(row=row, column=8), f'=IF(OR(F{row}="",G{row}=""),"",F{row}+G{row})', number_format=CURRENCY)
        formula_cell(debt.cell(row=row, column=9), f'=IF(OR(D{row}="",E{row}=""),"",D{row}+E{row}-G{row})', number_format=CURRENCY)
        debt.cell(row=row, column=10, value="Formula remains blank until debt terms are entered.")
        row += 1
    debt.freeze_panes = "C10"

    returns = wb.create_sheet("Returns")
    title(returns, "Cedarwood Flats | Levered Returns & Scenario Comparison", "Returns are calculated from the linked 36-month schedule only after timing, operating, and debt input SKUs are completed.")
    row = section(returns, 8, "BASE-CASE LEVERED CASH FLOW")
    row = header(returns, row, ["Month", "NOI", "Construction Spend", "Debt Service", "Levered Cash Flow", "Cumulative Cash Flow", "Notes"])
    first_return = row
    for month in range(1, 37):
        schedule_row = schedule_first + month - 1
        debt_row = first + month - 1
        returns.cell(row=row, column=3, value=month)
        formula_cell(returns.cell(row=row, column=4), f"='Monthly Schedule'!M{schedule_row}", linked=True, number_format=CURRENCY)
        formula_cell(returns.cell(row=row, column=5), f"='Monthly Schedule'!G{schedule_row}", linked=True, number_format=CURRENCY)
        formula_cell(returns.cell(row=row, column=6), f"='Debt Schedule'!H{debt_row}", linked=True, number_format=CURRENCY)
        formula_cell(returns.cell(row=row, column=7), f'=IF(OR(D{row}="",E{row}="",F{row}=""),"",D{row}-E{row}-F{row})', number_format=CURRENCY)
        if month == 1:
            formula_cell(returns.cell(row=row, column=8), f'=IF(G{row}="","",G{row})', number_format=CURRENCY)
        else:
            formula_cell(returns.cell(row=row, column=8), f'=IF(OR(G{row}="",H{row-1}=""),"",H{row-1}+G{row})', number_format=CURRENCY)
        returns.cell(row=row, column=9, value="No return is produced until all linked inputs are completed.")
        row += 1
    row += 1
    row = section(returns, row, "RETURN SUMMARY")
    row = header(returns, row, ["Metric", "Value", "Formula / Definition", "Status"])
    summaries = [
        ("Total levered cash flow", f'=IF(COUNT(G{first_return}:G{first_return+35})<36,"",SUM(G{first_return}:G{first_return+35}))', "36-month sum", CURRENCY),
        ("Monthly IRR", f'=IF(COUNT(G{first_return}:G{first_return+35})<36,"",IRR(G{first_return}:G{first_return+35}))', "IRR of monthly levered cash flow", PERCENT),
        ("Annualized IRR", f'=IF(D{row+1}="","",(1+D{row+1})^12-1)', "(1 + monthly IRR)^12 − 1", PERCENT),
        ("Equity multiple", f'=IF(OR(COUNTIF(G{first_return}:G{first_return+35},"<0")=0,COUNTIF(G{first_return}:G{first_return+35},">0")=0),"",SUMIF(G{first_return}:G{first_return+35},">0",G{first_return}:G{first_return+35})/-SUMIF(G{first_return}:G{first_return+35},"<0",G{first_return}:G{first_return+35}))', "Positive distributions ÷ negative equity cash flows", MULTIPLE),
    ]
    for metric, formula, definition, fmt in summaries:
        returns.cell(row=row, column=3, value=metric)
        formula_cell(returns.cell(row=row, column=4), formula, number_format=fmt)
        returns.cell(row=row, column=5, value=definition)
        returns.cell(row=row, column=6, value="Calculated only when 36 complete monthly cash-flow values exist.")
        row += 1
    returns.freeze_panes = "C10"
    return debt, returns


def build_summary(wb, input_rows, wbs_total_row, noi_row):
    ws = wb.create_sheet("Summary", 0)
    title(ws, "Cedarwood Flats | Underwriting Model Summary", "SKU-level model built from user-authorized historical planning figures and editable projected assumptions. This workbook is an underwriting tool—not a record of actual performance.")
    row = section(ws, 8, "HISTORICAL PLANNING CONTROLS")
    row = header(ws, row, ["Metric", "Value", "Source / Formula", "Status", "Model Treatment"])
    controls = [
        ("Development cost control", f"='Inputs - SKU Register'!G{input_rows['PRJ-001']}", "Authorized historical planning input", "Estimated historical planning", "Controls WBS reconciliation"),
        ("100-line WBS total", f"='WBS Budget'!K{wbs_total_row}", "Linked WBS total", "Formula", "Budget control"),
        ("WBS reconciliation", f"='WBS Budget'!K{wbs_total_row+1}", "WBS total less $40M control", "Formula", "Must equal $0.0"),
        ("Program units", f"='Inputs - SKU Register'!G{input_rows['PRJ-002']}", "Authorized historical planning input", "Estimated historical planning", "Program reference"),
        ("Buildings", f"='Inputs - SKU Register'!G{input_rows['PRJ-003']}", "Authorized historical planning input", "Estimated historical planning", "Program reference"),
        ("Annual NOI reference", f"='Inputs - SKU Register'!G{input_rows['PRJ-009']}", "Authorized historical planning input", "Estimated historical planning", "Reference only; not used to back-solve rents"),
        ("Historical yield on cost", f"='Inputs - SKU Register'!G{input_rows['PRJ-010']}", "$4.75M / $40M", "Derived historical planning", "Reference metric"),
        ("Financing reference", f"='Inputs - SKU Register'!G{input_rows['FIN-001']}", "Authorized historical planning input", "Estimated historical planning", "Reference only; not funded capital"),
    ]
    for metric, formula, source, status, treatment in controls:
        ws.cell(row=row, column=3, value=metric)
        formula_cell(ws.cell(row=row, column=4), formula, linked=True, number_format=PERCENT if "yield" in metric.lower() else CURRENCY if metric not in ("Program units", "Buildings") else INTEGER)
        ws.cell(row=row, column=5, value=source)
        ws.cell(row=row, column=6, value=status)
        ws.cell(row=row, column=7, value=treatment)
        row += 1
    row += 1
    row = section(ws, row, "ACTIVE UNDERWRITING CASE STATUS")
    row = header(ws, row, ["Required Driver Block", "SKU Lines", "Completion", "What the Model Does"])
    blocks = [
        ("Unit mix / market rent", "REV-*", '=COUNT(\'Rent Roll\'!E10:E13)&" / 4 unit counts; "&COUNT(\'Rent Roll\'!I10:I13)&" / 4 rents"', "Activates gross potential rent when populated."),
        ("Operating expenses", "OPX-*", '=COUNT(\'Revenue & Operations\'!E17:E30)&" / 14 items"', "Activates EGI and NOI when populated."),
        ("36-month timing", "SCH-*", '=COUNT(\'Monthly Schedule\'!F10:F45)&" / 36 construction; "&COUNT(\'Monthly Schedule\'!I10:I45)&" / 36 occupancy"', "Activates monthly construction and lease-up cash flow."),
        ("Financing terms", "FIN-010 to FIN-017", '=COUNT(\'Debt Schedule\'!E10:E17)&" / 8 terms"', "Activates debt service and levered cash flow."),
        ("Exit / return drivers", "EXIT-*", '=COUNT(\'Inputs - SKU Register\'!H{0}:H{1})&" / 3 exit drivers"'.format(input_rows['EXIT-001'], input_rows['EXIT-003']), "Supports exit and terminal-value analysis once entered."),
    ]
    for name, skus, completion, note in blocks:
        ws.cell(row=row, column=3, value=name)
        ws.cell(row=row, column=4, value=skus)
        formula_cell(ws.cell(row=row, column=5), completion)
        ws.cell(row=row, column=6, value=note)
        row += 1
    row += 1
    row = section(ws, row, "MODEL NAVIGATION")
    row = header(ws, row, ["Tab", "Purpose", "Required Action"])
    for tab, purpose, action in [
        ("Inputs - SKU Register", "All required numbers have a SKU and source field.", "Enter blue-font Base / Downside / Upside input cells with source comments."),
        ("WBS Budget", "100 development budget entries totaling $40M.", "Use as the project cost control and replace allowances only with sourced revisions."),
        ("Rent Roll", "Unit-type program and market-rent build.", "Enter unit counts, SF, rents, and occupancy by unit type."),
        ("Revenue & Operations", "Stabilized operating statement.", "Enter each operating expense line; do not force the historical NOI reference."),
        ("Monthly Schedule", "36-month construction and lease-up timing.", "Enter construction deployment and occupancy each month."),
        ("Sources & Uses / Debt Schedule", "Capital structure and debt mechanics.", "Enter active debt terms and actual intended sources."),
        ("Returns", "Monthly levered cash flow and return calculations.", "Review only after the linked underlying schedules are complete."),
    ]:
        ws.cell(row=row, column=3, value=tab)
        ws.cell(row=row, column=4, value=purpose)
        ws.cell(row=row, column=5, value=action)
        row += 1
    return ws


def main():
    wbs = extract_wbs()
    wb = Workbook()
    wb.calculation.fullCalcOnLoad = True
    wb.calculation.forceFullCalc = True
    inputs, input_rows = build_inputs(wb)
    _, wbs_total_row = build_wbs(wb, input_rows, wbs)
    build_rent_roll(wb, input_rows)
    _, noi_row = build_operations(wb, input_rows)
    _, schedule_first, schedule_total = build_monthly_schedule(wb, input_rows, wbs_total_row)
    build_sources_uses(wb, input_rows, wbs_total_row)
    build_debt_returns(wb, input_rows, schedule_first, schedule_total)
    build_summary(wb, input_rows, wbs_total_row, noi_row)
    for ws in wb.worksheets:
        autotext_widths(ws)
    wb.save(OUTPUT)
    print(f"Created {OUTPUT}")
    print(f"WBS lines: {len(wbs)}")
    print(f"WBS total: {sum(item['amount'] for item in wbs):,}")


if __name__ == "__main__":
    main()
