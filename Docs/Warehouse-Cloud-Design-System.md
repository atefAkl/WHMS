# Warehouse Cloud Operating System

## Design System v1

نظام تصميم لتطبيق ويب سحابي لإدارة مخازن مملوكة للشركة، مع تخزين بضائع مملوكة للعملاء عبر عقود ووحدات تخزين متنقلة تسمى "طبالي".

---

## 1. Product Design Principles

### 1.1 Operational First

التطبيق ليس موقعا تسويقيا. هو مساحة عمل يومية لفريق التشغيل، المخازن، الحسابات، وخدمة العملاء. لذلك التصميم يجب أن يعطي الأولوية للوضوح، السرعة، وتقليل الأخطاء.

### 1.2 Trackability Is The Core

كل كيان مهم يجب أن يكون قابلا للتتبع:

- العميل
- العقد
- الطبلية
- الموقع
- الحركة
- المستخدم الذي نفذ الإجراء
- الوقت والتاريخ

لا يوجد تغيير في موقع أو حالة طبلية بدون سجل حركة.

### 1.3 Dense But Calm

الشاشات يجب أن تعرض معلومات كثيرة، لكن بطريقة منظمة. الكثافة مطلوبة، الزحمة مرفوضة.

### 1.4 Context Before Navigation

المستخدم لا يجب أن يترك الشاشة الحالية لمجرد مراجعة تفاصيل سريعة. التفاصيل الثانوية تظهر في Drawer أو Side Panel.

### 1.5 Contracts Drive Operations

أي عملية تخزين أو خروج أو فاتورة يجب أن تكون مرتبطة بعقد، لأن العلاقة مع العميل قانونية وتجارية وليست مجرد حركة مخزن.

---

## 2. Typography

### 2.1 Font Family

الخط الأساسي المقترح:

```css
font-family: "IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif;
```

سبب الاختيار:

- واضح في الجداول.
- مناسب للواجهات التشغيلية.
- يدعم العربية بشكل جيد.
- يعطي إحساسا إداريا حديثا بدون مبالغة.

### 2.2 Type Scale

| الاستخدام     | الحجم | Line Height | الوزن |
| ------------- | ----: | ----------: | ----: |
| Page Title    |  24px |        32px |   600 |
| Section Title |  18px |        28px |   600 |
| Panel Title   |  16px |        24px |   600 |
| Body Text     |  14px |        22px |   400 |
| Table Text    |  13px |        20px |   400 |
| Small Text    |  12px |        18px |   400 |
| KPI Number    |  28px |        36px |   700 |

### 2.3 Typography Rules

- لا تستخدم أحجام ضخمة إلا في مؤشرات Dashboard المهمة.
- النص داخل الجداول يبدأ من 13px.
- العناوين داخل Panels لا تتجاوز 16px غالبا.
- الأرقام المهمة تستخدم وزن 700.
- لا تستخدم Letter Spacing سالبة.
- لا تستخدم نصوص زخرفية أو تسويقية داخل واجهة التشغيل.

---

## 3. Spacing & Density

### 3.1 Spacing Scale

| Token   | Value | Usage                              |
| ------- | ----: | ---------------------------------- |
| space-1 |   4px | مسافات دقيقة بين أيقونة ونص        |
| space-2 |   8px | فجوات بين عناصر صغيرة              |
| space-3 |  12px | تجميع عناصر مرتبطة                 |
| space-4 |  16px | padding قياسي للبطاقات والـ panels |
| space-6 |  24px | فصل مجموعات كبيرة                  |
| space-8 |  32px | فصل sections رئيسية                |

### 3.2 Density Rules

| العنصر            | الارتفاع |
| ----------------- | -------: |
| Table Row Compact |     40px |
| Table Row Default |     44px |
| Input             |     38px |
| Button            |     36px |
| Icon Button       |     32px |
| Top Bar           |     56px |
| Sidebar Item      |     40px |

### 3.3 Density Philosophy

- الجداول تعرض أكبر قدر مفيد من البيانات.
- المساحة البيضاء تستخدم للفصل والقراءة، لا للزينة.
- لا توجد Cards كبيرة غير ضرورية.
- لا توجد Hero sections داخل التطبيق.

---

## 4. Layout Architecture

### 4.1 Global Shell

الهيكل العام:

```text
+------------------------------------------------+
| Top Bar                                        |
+-------------+----------------------------------+
| Sidebar     | Page Workspace                   |
|             | Header                           |
|             | Toolbar / Filters                |
|             | Main Content                     |
|             | Context Drawer عند الحاجة        |
+-------------+----------------------------------+
```

### 4.2 Regions

#### Top Bar

يحتوي على:

- بحث عام.
- تنبيهات.
- اسم المستخدم.
- اختيار الفرع أو المخزن عند الحاجة.

#### Sidebar

تنقل أساسي بين مساحات العمل.

#### Page Workspace

المساحة الرئيسية التي تحتوي على الجداول، النماذج، الخرائط، والتفاصيل.

#### Context Drawer

يفتح من اليمين في الواجهة العربية، ويستخدم لعرض تفاصيل:

- طبلية.
- عقد.
- عميل.
- حركة.
- فاتورة.

بدون إخراج المستخدم من سياق عمله.

---

## 5. Grid System

### 5.1 Page Grid

- Desktop: 12 columns.
- Gap: 16px.
- Page padding: 24px.
- Max content width: لا يتم فرض حد ضيق، لأن التطبيق تشغيلي ويحتاج مساحة أفقية.

### 5.2 Content Patterns

#### Dashboard

```text
4 KPI Cards
2-column operational summaries
Full-width urgent tables
```

#### List Workspace

```text
Page Header
Filter Bar
Table
Pagination / Bulk Actions
Context Drawer
```

#### Detail Workspace

```text
Main Details: 8 columns
Summary / Timeline: 4 columns
```

#### Forms

- نموذج بسيط: عمود واحد.
- نموذج إداري: عمودان.
- الحقول القصيرة فقط يمكن أن تظهر في 3 أعمدة.

---

## 6. Workspace Thinking

### 6.1 Core Mental Model

قلب النظام:

```text
Customer + Contract + Pallet + Location + Movement History
```

### 6.2 Every Workspace Must Answer

كل شاشة رئيسية يجب أن تجيب بسرعة عن:

- ما الذي أتابعه؟
- ما الحالة الحالية؟
- أين أبحث؟
- ما الإجراء التالي؟
- أين التاريخ أو السجل؟
- ما المخاطر أو التنبيهات؟

### 6.3 Pallet Workspace Priority

شاشة الطبالي هي أهم Workspace لأنها تربط:

- العميل.
- العقد.
- الموقع.
- الحالة.
- الحركة.
- الخروج.
- الجرد.

كل طبلية يجب أن يظهر معها دائما:

- رقم الطبلية.
- الحالة.
- الموقع الحالي.
- العميل.
- العقد.
- آخر حركة.

---

## 7. Visual Direction

### 7.1 Personality

الاتجاه البصري:

- عملي.
- موثوق.
- هادئ.
- منظم.
- غير تسويقي.
- مناسب للاستخدام اليومي الطويل.

### 7.2 Color Tokens

```css
:root {
  --color-bg: #f6f7f9;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f4f8;
  --color-text: #1f2933;
  --color-text-muted: #64748b;
  --color-border: #d9dee7;

  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;

  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  --color-info: #0891b2;

  --color-empty: #94a3b8;
}
```

### 7.3 Surface Rules

- الخلفية العامة رمادية فاتحة.
- المحتوى الأساسي على Surface أبيض.
- الحدود أهم من الظلال.
- الظلال تستخدم فقط للـ Drawer و Modal والقوائم العائمة.
- Radius قياسي: 6px إلى 8px.

### 7.4 Status Color Rule

اللون لا يكفي وحده. كل حالة يجب أن تظهر بنص واضح بجانب اللون.

---

## 8. Navigation Thinking

### 8.1 Primary Navigation

```text
الرئيسية

التشغيل
- الاستلام
- الخروج
- الحركات
- الطبالي

الإدارة
- العملاء
- العقود
- الفواتير

المخازن
- المواقع
- السعة
- الجرد

النظام
- التقارير
- المستخدمون
- الإعدادات
```

### 8.2 Navigation Rules

- التنقل يجب أن يعكس طريقة العمل، وليس قاعدة البيانات فقط.
- أهم شاشات التشغيل تكون قريبة.
- لا يتم دفن شاشة الطبالي داخل إعدادات أو مخازن.
- تفاصيل الكيان تظهر غالبا في Drawer.
- صفحات التفاصيل الكاملة تستخدم عندما يكون هناك تحرير كبير أو مراجعة عميقة.

### 8.3 Global Search

البحث العام يجب أن يدعم:

- رقم الطبلية.
- رقم العقد.
- اسم العميل.
- كود الموقع.
- رقم الفاتورة.
- رقم حركة التخزين.

---

## 9. Table Grammar

### 9.1 Table Structure

كل جدول رئيسي يتبع النمط التالي:

```text
Identifier | Context Columns | Status | Date / Last Activity | Actions
```

مثال جدول الطبالي:

```text
رقم الطبلية | العميل | العقد | المخزن | الموقع | الحالة | آخر حركة | إجراءات
```

### 9.2 Table Rules

- أول عمود هو المعرف الأساسي.
- الحالة تظهر Badge واضحة.
- آخر عمود للإجراءات.
- الأعمدة الرقمية تكون بمحاذاة ثابتة.
- التواريخ تستخدم صيغة موحدة.
- الجداول الكبيرة تدعم Sticky Header.
- أول عمود وآخر عمود يمكن تثبيتهما عند التمرير الأفقي.

### 9.3 Table Actions

الإجراءات الأساسية:

- عرض.
- تعديل.
- نقل.
- خروج.
- سجل الحركة.
- طباعة QR أو Label.

الإجراءات الخطيرة لا تظهر كزر عادي وسط الإجراءات المتكررة.

### 9.4 Filters

فلاتر شائعة:

- العميل.
- العقد.
- المخزن.
- الموقع.
- الحالة.
- الفترة الزمنية.
- بحث حر.

قاعدة:
الفلاتر المهمة تظهر مباشرة. الفلاتر الأقل استخداما داخل قائمة Advanced Filters.

---

## 10. Interaction Rules

### 10.1 Action Hierarchy

| النوع       | الاستخدام                 |
| ----------- | ------------------------- |
| Primary     | الإجراء الرئيسي في الشاشة |
| Secondary   | إجراء مساعد               |
| Icon Button | أدوات سريعة ومتكررة       |
| Ghost       | إجراء منخفض الأهمية       |
| Danger      | حذف، إلغاء، خروج نهائي    |

### 10.2 Movement Rule

أي تغيير في موقع الطبلية يجب أن ينشئ Movement Record يحتوي على:

- الطبلية.
- الموقع القديم.
- الموقع الجديد.
- السبب.
- المستخدم.
- التاريخ والوقت.
- ملاحظة اختيارية.

### 10.3 Confirmation Rules

تحتاج تأكيد:

- خروج طبلية.
- إلغاء عقد.
- حذف كيان.
- إلغاء فاتورة.
- تغيير حالة مؤثرة ماليا أو تشغيليا.

لا تحتاج تأكيد:

- فتح Drawer.
- تطبيق فلتر.
- البحث.
- التنقل بين Tabs.

### 10.4 Feedback

- نجاح الحفظ: Toast قصير.
- أخطاء الحقول: تظهر بجانب الحقل.
- أخطاء النظام: تظهر في Banner أعلى المساحة.
- العمليات الطويلة: تظهر Loading State واضح.

---

## 11. State System

### 11.1 Pallet States

| الحالة       | اللون   | المعنى                           | إجراءات مسموحة          |
| ------------ | ------- | -------------------------------- | ----------------------- |
| فارغة        | Empty   | لا تحتوي على بضاعة               | تخصيص، حجز              |
| محجوزة       | Info    | مخصصة لعقد أو عميل ولم تستلم بعد | إلغاء حجز، استلام       |
| مشغولة       | Success | عليها بضاعة داخل المخزن          | نقل، فحص، تجهيز خروج    |
| تحت الفحص    | Warning | تحتاج مراجعة أو جرد              | إنهاء فحص، تعليق        |
| قيد النقل    | Info    | تتحرك بين موقعين                 | تأكيد وصول، إلغاء حركة  |
| جاهزة للخروج | Warning | تم تجهيزها للخروج                | تأكيد خروج، إلغاء تجهيز |
| خارجة        | Empty   | خرجت من المخزن                   | عرض السجل               |
| متضررة       | Danger  | بها مشكلة أو تلف                 | فحص، تقرير، تعليق       |

### 11.2 Contract States

| الحالة        | اللون   |
| ------------- | ------- |
| مسودة         | Empty   |
| نشط           | Success |
| قريب الانتهاء | Warning |
| موقوف         | Danger  |
| منتهي         | Empty   |
| ملغي          | Danger  |

### 11.3 Movement States

| الحالة      | اللون   |
| ----------- | ------- |
| مسجلة       | Info    |
| قيد التنفيذ | Warning |
| مكتملة      | Success |
| مرفوضة      | Danger  |
| ملغاة       | Empty   |

### 11.4 Invoice States

| الحالة | اللون   |
| ------ | ------- |
| مسودة  | Empty   |
| مصدرة  | Info    |
| مدفوعة | Success |
| متأخرة | Warning |
| ملغاة  | Danger  |

---

## 12. Component Foundations

### 12.1 Buttons

#### Primary Button

لإجراء واحد رئيسي في الشاشة.

أمثلة:

- إنشاء عقد.
- تسجيل استلام.
- تأكيد خروج.

#### Secondary Button

لإجراءات داعمة.

أمثلة:

- تصدير.
- طباعة.
- حفظ كمسودة.

#### Icon Button

للأدوات المتكررة.

أمثلة:

- بحث.
- فلتر.
- طباعة.
- فتح السجل.

### 12.2 Badges

تستخدم للحالات فقط، وليس للزينة.

خصائص:

- ارتفاع 24px.
- نص 12px.
- Radius 999px أو 6px حسب النمط النهائي.
- لون خلفية خفيف مع نص داكن.

### 12.3 Forms

قواعد النماذج:

- Label أعلى الحقل.
- الخطأ يظهر تحت الحقل.
- الحقول المطلوبة تظهر بعلامة واضحة.
- لا تستخدم Placeholder كبديل للـ Label.
- الحقول المالية والتواريخ لها تنسيق ثابت.

### 12.4 Drawers

الاستخدام:

- مراجعة تفاصيل سريعة.
- تنفيذ إجراء محدود.
- عرض Timeline.

الأحجام:

- Small: 360px.
- Medium: 520px.
- Large: 720px.

### 12.5 Modals

تستخدم فقط عند:

- تأكيد إجراء خطير.
- إدخال سريع لا يحتاج سياق صفحة.
- اختيار عنصر من قائمة قصيرة.

---

## 13. Empty, Loading, Error States

### 13.1 Empty State

يجب أن يوضح:

- لا توجد بيانات.
- السبب المحتمل.
- الإجراء التالي إن وجد.

مثال:

```text
لا توجد طبالي لهذا العميل
يمكنك تخصيص طبلية جديدة من إجراء "تخصيص طبلية".
```

### 13.2 Loading State

- الجداول تستخدم Skeleton Rows.
- الأزرار تعرض Spinner صغير عند تنفيذ إجراء.
- لا يتم تغيير التخطيط أثناء التحميل.

### 13.3 Error State

أنواع الأخطاء:

- Field Error.
- Page Error.
- Permission Error.
- System Error.

قاعدة:
رسالة الخطأ يجب أن تساعد المستخدم على اتخاذ إجراء، لا أن تكون تقنية فقط.

---

## 14. Accessibility & Usability

- التباين يجب أن يكون واضحا للنصوص الأساسية.
- كل Icon Button يحتاج Tooltip.
- الحالة لا تعتمد على اللون فقط.
- الجداول تدعم تنقل لوحة المفاتيح في النسخ المتقدمة.
- مناطق النقر لا تقل عن 32px.
- النصوص داخل الأزرار لا تلتف بشكل مكسور.

---

## 15. First Screen Priorities

بعد تثبيت هذا النظام، الأولوية في تصميم الشاشات:

1. Pallet Workspace
2. Receiving Workspace
3. Warehouse Locations
4. Customer Profile
5. Contract Details
6. Dashboard
7. Invoicing
8. Reports

السبب:
التطبيق التشغيلي يبدأ من تتبع الطبلية، لأن الطبلية هي نقطة التقاء العميل والعقد والموقع والحركة.

---

## 16. Naming Conventions

### 16.1 IDs

```text
Customer: CUS-0001
Contract: CNT-2026-001
Pallet: PAL-000001
Warehouse: WH-01
Location: WH-01-A-R03-S12
Movement: MOV-2026-000001
Invoice: INV-2026-000001
```

### 16.2 Location Code

```text
WH-01 / Zone A / Row 03 / Slot 12
```

Display short form:

```text
WH-01-A-R03-S12
```

---

## 17. Design Tokens Summary

```css
:root {
  --font-ui: "IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  --row-compact: 40px;
  --row-default: 44px;
  --control-height: 38px;
  --button-height: 36px;
  --icon-button: 32px;

  --color-bg: #f6f7f9;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f4f8;
  --color-text: #1f2933;
  --color-text-muted: #64748b;
  --color-border: #d9dee7;
  --color-primary: #2563eb;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger: #dc2626;
  --color-info: #0891b2;
}
```

---

## 18. Next Step

الخطوة التالية هي تصميم أول Workspace فعلي:

```text
Pallet Workspace
```

ويشمل:

- صفحة قائمة الطبالي.
- فلاتر البحث.
- جدول الطبالي.
- Drawer تفاصيل الطبلية.
- سجل الحركات.
- إجراءات: نقل، تجهيز خروج، فحص، طباعة QR.
