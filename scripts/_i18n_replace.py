import re, sys

FILE = r"C:\laragon\www\WHMS\resources\js\Pages\Contracts\Show.jsx"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

# Each entry: (ar_text, en_text, key)
# For same ar_text with different en_text variants, list both so both are caught.
# CSS classes and dir values ("rtl"/"ltr", "h-3.5...") are NOT included.
PAIRS = [
    # Tabs
    ("عرض العقد", "Contract View", "tab_view"),
    ("فترات العقد", "Periods", "tab_periods"),
    ("مندوبي العقد", "Delegates", "tab_delegates"),
    ("المستحقات والدفعات", "Financials", "tab_financials"),
    ("السندات", "Vouchers", "tab_vouchers"),
    ("طبالي العقد", "Pallets", "tab_pallets"),
    ("أصناف مخزنة", "Stored Items", "tab_stored_items"),
    # Breadcrumb
    ("العملاء", "Customers", "breadcrumb_customers"),
    ("العقد", "Contract", "breadcrumb_contract"),
    # Action buttons
    ("تعديل العقد", "Edit Contract", "edit_contract"),
    ("تنشيط العقد", "Activate", "activate"),
    ("إلغاء العقد", "Cancel", "cancel_contract"),
    ("حذف العقد نهائياً", "Delete", "delete_contract"),
    ("إنهاء العقد", "End Contract", "end_contract"),
    ("إيقاف مؤقت للعقد", "Suspend", "suspend_contract"),
    ("إلغاء", "Cancel", "cancel"),
    ("حفظ التعديلات", "Save Changes", "save_changes"),
    ("إزالة", "Remove", "remove"),
    ("توقيع", "Sign", "sign"),
    ("سحب بضائع", "Withdraw", "withdraw"),
    ("إجراءات", "Actions", "actions"),
    ("تنشيط", "Activate", "activate_short"),
    ("إيقاف", "Suspend", "suspend_short"),
    ("سبب الإجراء (مطلوب)", "Reason (Required)", "action_reason"),
    ("هل أنت متأكد من حذف العقد نهائياً؟", "Are you sure you want to delete this contract?", "delete_confirm"),
    # Edit modal
    ("تعديل بيانات العقد", "Edit Contract", "edit_contract_data"),
    ("مقدمة العقد", "Introduction", "introduction_section"),
    ("تمهيد العقد", "Preamble", "preamble_section"),
    ("حفظ البيانات الزمنية", "Save Timing", "save_timing"),
    ("حفظ الشروط والأحكام", "Save Terms", "save_terms"),
    ("حفظ التمهيد", "Save Preamble", "save_preamble"),
    ("حفظ الوحدات والأصناف", "Save Storage Allocation", "save_storage"),
    ("حفظ المقدمة", "Save Introduction", "save_introduction"),
    ("حفظ المندوب", "Save Representative", "save_representative"),
    # Notes & dates
    ("ملاحظات", "Notes", "notes"),
    ("البيانات الزمنية", "Timing", "timing"),
    ("تاريخ البداية", "Start Date", "start_date"),
    ("تاريخ بداية العقد", "Start Date", "start_date"),
    ("تاريخ البداية الهجري", "Hijri Start Date", "hijri_start"),
    ("تاريخ الدفع", "Payment Date", "payment_date"),
    ("تاريخ الإصدار", "Issue Date", "issue_date"),
    ("تاريخ الإصدار:", "Issue Date:", "issue_date_label"),
    ("تاريخ الاستحقاق", "Due Date", "due_date"),
    ("تاريخ النهاية", "End Date", "end_date"),
    ("تاريخ الكتابة", "Write Date", "write_date"),
    ("تاريخ كتابة العقد", "Write Date", "write_date"),
    # Periods
    ("فترات وتمديد العقد", "Contract Periods & Extension", "periods_extension"),
    ("تجديد وتمديد العقد (إضافة فترة)", "Extend Contract Period", "extend_period"),
    ("تجديد وتمديد العقد", "Extend Contract", "extend_contract"),
    ("مدة التمديد (بالأشهر)", "Extension Duration (Months)", "extension_months"),
    ("تأكيد التمديد", "Confirm Extension", "confirm_extension"),
    ("فترة التجديد (بالأشهر)", "Renewal Period (Months)", "renewal_period_months"),
    ("فترة التجديد", "Renewal Period", "renewal_period"),
    ("الفترة الإلزامية (بالأشهر)", "Mandatory Period (Months)", "mandatory_period_months"),
    ("الفترة الإلزامية", "Mandatory Period", "mandatory_period"),
    ("شهر", "Months", "months"),
    # Delegates
    ("مندوبي العقد المسجلين", "Assigned Contract Delegates", "delegates_assigned"),
    ("إضافة المندوب", "Add Delegate", "add_delegate"),
    ("إضافة مندوب للعقد", "Add Contract Delegate", "add_contract_delegate"),
    ("إضافة مندوب للعقد", "Add Delegate", "add_contract_delegate"),
    ("إزالة المندوب من العقد", "Remove Delegate", "remove_delegate"),
    ("إيقاف المندوب", "Suspend Delegate", "suspend_delegate"),
    ("تأكيد الإزالة", "Confirm Remove", "confirm_remove"),
    ("تأكيد الإيقاف", "Confirm Suspend", "confirm_suspend"),
    ("اسم المندوب", "Name", "delegate_name"),
    ("رقم الهاتف", "Phone", "phone_number"),
    ("الصلاحيات", "Authorities", "authorities"),
    ("أصحاب المصلحة", "Stakeholders", "stakeholders"),
    ("-- اختر المندوب --", "-- Select Delegate --", "select_delegate"),
    ("اختر المندوب من قائمة العميل", "Select Delegate from Customer Contacts", "select_delegate_from_customer"),
    ("اختر مندوباً...", "Select a representative...", "select_representative"),
    ("-- بدون ربط --", "-- No Link --", "no_link"),
    # Financials
    ("المبلغ المستحق", "Amount", "amount_due"),
    ("المبلغ المسدد", "Amount", "amount_paid"),
    ("إصدار الفاتورة", "Issue Invoice", "issue_invoice"),
    ("إصدار فاتورة مستحقة", "Issue Financial Invoice", "issue_financial_invoice"),
    ("إصدار فاتورة مستحقة", "Issue Invoice", "issue_financial_invoice"),
    ("المستحقات المالية (الفواتير)", "Financial Dues (Invoices)", "financial_dues"),
    ("لا توجد فواتير مستحقة.", "No invoices.", "no_invoices"),
    ("تسجيل الدفعة", "Record Payment", "record_payment"),
    ("تسجيل دفعة نقدية", "Record Cash Payment", "record_cash_payment"),
    ("تسجيل دفعة نقدية", "Record Payment", "record_cash_payment"),
    ("طريقة الدفع", "Method", "payment_method"),
    ("كاش", "Cash", "cash"),
    ("شيك", "Cheque", "cheque"),
    ("تحويل بنكي", "Bank Transfer", "bank_transfer"),
    ("الدفعات النقدية المسددة", "Cash Payments Recorded", "cash_payments"),
    ("ربط بفاتورة مستحقة (اختياري)", "Link to Invoice (Optional)", "link_invoice"),
    ("لا توجد دفعات مسجلة.", "No payments.", "no_payments"),
    ("رقم الفاتورة", "Invoice #", "invoice_no"),
    ("رقم الفاتورة", "Invoice Number", "invoice_no"),
    ("المبلغ", "Amount", "amount"),
    ("المدفوع", "Paid", "paid"),
    ("الإجمالي (شامل الضريبة)", "Total (Inc. VAT)", "total_with_vat"),
    ("الإجمالي الكلي", "Grand Total", "grand_total"),
    ("الإيجار الشهري", "Monthly Rent", "monthly_rent"),
    # Vouchers
    ("سندات العقد (إدخال - إخراج - ترحيل - تسوية)", "Contract Vouchers", "vouchers_history"),
    ("سيتم تفعيل موديول السندات وحركاتها (الإدخال، الإخراج، الترحيل، والتسوية) لاحقاً بناءً على الخطة المعتمدة.", "Vouchers module will be enabled later as per approved plan.", "vouchers_later"),
    ("هيكل السندات جاهز للاستخدام المستقبلي", "Vouchers Structure Ready for Future Use", "vouchers_ready"),
    # Pallets
    ("طبالي العقد (هيستوري وحركة وحمولات)", "Contract Pallets", "pallets_history"),
    ("سيتم تفعيل حركة الطبالي وسجل الحمولات لاحقاً.", "Pallets tracking and payloads history will be enabled later.", "pallets_later"),
    ("هيكل الطبالي جاهز للاستخدام المستقبلي", "Pallets Structure Ready for Future Use", "pallets_ready"),
    # Stored items
    ("الأصناف المخزنة على العقد (هيستوري وحركة كميات)", "Stored Items", "stored_items_history"),
    ("سيتم تفعيل سجل حركة كميات الأصناف المخزنة لاحقاً.", "Stored items inventory history will be enabled later.", "stored_items_later"),
    ("هيكل الأصناف جاهز للاستخدام المستقبلي", "Stored Items Structure Ready for Future Use", "stored_items_ready"),
    ("إضافة صنف تخزيني", "Add Storage Item", "add_storage_item"),
    ("لا توجد وحدات تخزين مضافة. اضغط على الزر أدناه للإضافة.", "No storage items added. Click the button below to add.", "no_storage"),
    ("جدول الوحدات التخزينية والأصناف", "Storage Allocation Table", "storage_table"),
    ("وحدات التخزين والأصناف", "Storage Allocation", "storage_allocation"),
    # Terms
    ("الشروط والأحكام", "Terms & Conditions", "terms_conditions"),
    ("مكتبة الشروط العامة المتاحة", "Available Library Terms", "library_terms"),
    ("إضافة شرط مخصص", "Add Custom Term", "add_custom_term"),
    ("اكتب شرطاً مخصصاً جديداً هنا...", "Write a custom term here...", "write_custom_term"),
    ("لا توجد شروط مضافة للعقد حالياً.", "No terms added to this contract.", "no_terms"),
    ("لا توجد شروط مخصصة.", "No custom terms.", "no_custom_terms"),
    ("تم إضافة جميع شروط المكتبة.", "All library terms have been added.", "all_terms_added"),
    # Introduction & preamble
    ("الافتتاحية", "Introduction", "introduction_label"),
    ("التمهيد", "Preamble", "preamble_label"),
    ("لا توجد مقدمة.", "No introduction.", "no_introduction"),
    ("لا يوجد تمهيد.", "No preamble.", "no_preamble"),
    # Contract view / print
    ("عقد إيجار وحدات تخزينية", "Storage Units Lease Contract", "contract_title"),
    ("أطراف العقد", "Contract Parties", "contract_parties"),
    ("الطرف الأول (المؤجر):", "First Party (Lessor):", "first_party_label"),
    ("الطرف الأول (المؤجر)", "First Party (Lessor)", "first_party"),
    ("الطرف الثاني (المستأجر):", "Second Party (Lessee):", "second_party_label"),
    ("الطرف الثاني (المستأجر)", "Second Party (Lessee)", "second_party"),
    ("ويمثله في هذا العقد:", "Represented by:", "represented_by"),
    ("المندوب المفوض للعقد", "Authorized Representative", "authorized_rep"),
    ("الختم الرسمي:", "Official Stamp:", "official_stamp"),
    ("المدير العام", "General Manager", "general_manager"),
    ("المؤسسة", "Institution", "institution"),
    ("طباعة العقد (A4)", "Print Contract (A4)", "print_contract"),
    ("نظام إدارة الجودة", "QMS Data", "qms_data"),
    # Field labels
    ("الشركة:", "Company:", "company"),
    ("العميل:", "Customer:", "customer_label"),
    ("العميل", "Customer", "customer"),
    ("الاسم:", "Name:", "name"),
    ("التوقيع:", "Signature:", "signature"),
    ("س.ت:", "CR:", "cr_short"),
    ("ر.ض:", "VAT:", "vat_short"),
    ("ترخيص:", "License:", "license"),
    ("رقم العقد:", "Contract No:", "contract_no"),
    ("التاريخ:", "Date:", "date_label"),
    ("التاريخ", "Date", "date"),
    ("التاريخ الهجري", "Hijri Date", "hijri_date"),
    ("سجل تجاري:", "CR:", "cr_full"),
    ("الرقم الضريبي:", "VAT:", "vat"),
    ("هاتف:", "Phone:", "phone"),
    ("سجل/هوية:", "CR/ID:", "cr_id"),
    ("رقم الإصدار:", "Issue No:", "issue_no"),
    ("الصنف", "Item", "item"),
    ("العدد", "Qty", "qty"),
    ("الخصم", "Discount", "discount"),
    ("الحالة", "Status", "status"),
    ("المرجع / الملاحظات", "Reference / Notes", "reference_notes"),
    # Statuses
    ("مسودة", "Draft", "status_draft"),
    ("نشطة", "Active", "status_active_f"),
    ("نشط", "Active", "status_active"),
    ("موقوف", "Suspended", "status_suspended"),
    ("منتهية", "Ended", "status_ended_f"),
    ("منتهي", "Ended", "status_ended"),
    ("ملغي", "Cancelled", "status_cancelled"),
    ("مدفوعة", "Paid", "status_paid"),
    # Misc
    ("إعدادات الموسم", "Season Settings", "season_settings"),
    ("تم حذفه", "Deleted", "deleted"),
]

total = 0
skipped = []

for (ar, en, key) in PAIRS:
    ar_esc = re.escape(ar)
    en_esc = re.escape(en)
    replacement = f't("show.{key}")'

    # Pattern 1: single line
    p1 = rf'lang === "ar" \? "{ar_esc}" : "{en_esc}"'
    # Pattern 2: multiline (flexible whitespace between lines)
    p2 = rf'lang === "ar"\s*\n\s*\? "{ar_esc}"\s*\n\s*: "{en_esc}"'

    n1 = len(re.findall(p1, content))
    n2 = len(re.findall(p2, content))

    if n1 + n2 == 0:
        skipped.append(f'NO MATCH: ar="{ar}" en="{en}" key={key}')
    else:
        if n1:
            content = re.sub(p1, replacement, content)
        if n2:
            content = re.sub(p2, replacement, content)
        total += n1 + n2

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Done. Replaced {total} occurrences.")
if skipped:
    print("\nNo matches found for:")
    for s in skipped:
        print(" ", s)
