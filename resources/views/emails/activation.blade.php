<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            margin: 0;
            padding: 0;
            direction: rtl;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 30px;
            text-align: right;
        }
        .header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: 800;
            color: #2563eb;
            margin: 0;
        }
        h2 {
            color: #1e293b;
            font-size: 20px;
            margin-top: 0;
        }
        p {
            font-size: 15px;
            line-height: 1.6;
            margin: 10px 0;
        }
        .btn-container {
            margin: 30px 0;
            text-align: center;
        }
        .btn {
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            font-weight: 700;
            font-size: 15px;
            display: inline-block;
        }
        .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 12px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">WHMS</h1>
        </div>
        
        <h2>مرحباً {{ $companyName }}!</h2>
        
        <p>يسعدنا إعلامك بأنه قد تمت الموافقة على طلبك بنجاح، وتم تفعيل مستودعك السحابي ونطاقك الفرعي الخاص.</p>
        
        <p>يرجى النقر على الزر أدناه لتنشيط حسابك، واختيار اسم المستخدم وكلمة المرور الخاصة بك للبدء في استخدام النظام:</p>
        
        <div class="btn-container">
            <a href="{{ $activationLink }}" class="btn">تنشيط الحساب وإعداد كلمة المرور</a>
        </div>
        
        <p>إذا لم يعمل الزر أعلاه، يمكنك نسخ الرابط التالي ولصقه في متصفحك:</p>
        <p style="word-break: break-all; font-size: 13px; color: #2563eb; font-family: monospace;">{{ $activationLink }}</p>
        
        <div class="footer">
            <p>هذا البريد الإلكتروني مرسل تلقائياً من نظام WHMS لإدارة المستودعات.</p>
        </div>
    </div>
</body>
</html>
