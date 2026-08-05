import React, { useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { Printer, ArrowRight } from "lucide-react";

/**
 * مكون وثيقة ورقة الانتظار (Waiting Ticket Document)
 * - خط Cairo مع أوزان دقيقة.
 * - حد بكسل واحد فقط للبطاقات الداخلية بدون حد خارجي للوثيقة.
 * - حجم خط ديناميكي لاسم العميل بين 12px و 20px.
 */
export function WaitingTicketDocument({
  smallCount = "140",     // SM: عدد الوحدات التخزينية الصغيرة المتبقية
  largeCount = "120",     // LG: عدد الوحدات التخزينية الكبيرة المتبقية
  sequenceNo = "01",     // ترتيب وصول السائق اليومي
  contractNo = "236",     // رقم العقد الرئيسي للعميل
  driverName = "خليل رضوان",     // اسم السائق
  estimatedLoad = "",            // الحمولة التقديرية
  dateTime = "Wed – 13:43:25",         // يوم وساعة ووقت الوصول
  customerName = "عبد العزيز عبد الله مازن مريد الشمري", // اسم العميل الكامل
  gregorianDate = "05/08/2026",// تاريخ توليد الوثيقة (ميلادي)
  hijriDate = "22/03/1448",       // تاريخ توليد الوثيقة (هجري)
}) {
  // حساب حجم خط اسم العميل ديناميكياً
  const getFontSize = (text) => {
    if (!text) return 16;
    const len = text.trim().length;
    if (len <= 18) return 20;
    if (len >= 40) return 12;
    const size = 20 - ((len - 18) / (40 - 18)) * 8;
    return Math.max(12, Math.min(20, Math.round(size)));
  };

  const fontSize = getFontSize(customerName);
  const numberFontFamily = 'Impact, "Arial Narrow", sans-serif-condensed, sans-serif';

  return (
    <div className="w-[520px] bg-white p-4 font-['Cairo',sans-serif] text-black select-none print:p-0 print:w-full">
      <div className="flex gap-4 items-start">
        {/* العمود الأيسر - وحدات التخزين، رقم ترتيب السائق، والتواريخ */}
        <div className="w-[180px] flex flex-col items-center gap-2.5 shrink-0">

          {/* وحدات التخزين المتبقية (Fieldset & Legend) */}
          <div className="grid grid-cols-2 gap-2 w-full">
            {/* SM - الوحدات الصغيرة */}
            <fieldset className="border border-black rounded-xl px-1 pb-1 pt-0 text-center relative">
              <legend className="px-1.5 text-[11px] font-bold border border-black rounded bg-white leading-none mx-auto -mt-2">
                SM
              </legend>
              <div className="text-2xl font-black leading-tight pt-0.5" style={{ fontFamily: 'Cairo', letterSpacing: '1px' }}>{smallCount}</div>
            </fieldset>

            {/* LG - الوحدات الكبيرة */}
            <fieldset className="border border-black rounded-xl px-1 pb-1 pt-0 text-center relative">
              <legend className="px-1.5 text-[11px] font-bold border border-black rounded bg-white leading-none mx-auto -mt-2">
                LG
              </legend>
              <div className="text-2xl font-black leading-tight pt-0.5" style={{ fontFamily: 'Cairo', letterSpacing: '1px' }}>{largeCount}</div>
            </fieldset>
          </div>

          {/* رقم ترتيب وصول السائق اليومي (01) - 140px, Impact font, 1px letter spacing */}
          <div className="w-full border border-black rounded-2xl h-36 flex items-center justify-center bg-white overflow-hidden">
            <span
              className="font-black leading-none"
              style={{
                fontSize: '140px',
                fontFamily: numberFontFamily,
                letterSpacing: '1px',
              }}
            >
              {sequenceNo}
            </span>
          </div>

          {/* تواريخ توليد الوثيقة (ميلادي وهجري) */}
          <div className="w-full text-center space-y-0.5 font-bold tracking-wider pt-0.5" style={{ font: "Bold 1.8rem/1.2 'Cairo'", letterSpacing: '1px' }}>
            <div>{gregorianDate}</div>
            <div>{hijriDate}</div>
          </div>
        </div>

        {/* العمود الأيمن - معلومات السائق، وقت الوصول، اسم العميل، ورقم العقد */}
        <div className="flex-1 flex flex-col justify-between h-full min-h-[295px]" >
          {/* البيانات العلوية */}
          <div className="space-y-2">
            {/* اسم السائق والحمولة التقديرية */}
            <div className="text-right text-lg font-bold tracking-wide">
              D: {driverName} {estimatedLoad ? <span className="text-base text-gray-800 border-r-2 border-black pr-2 mr-2">W: {estimatedLoad}</span> : ""}
            </div>

            {/* يوم ووقت الوصول */}
            <div className="text-center text-[2rem] font-bold tracking-wider py-0.5"
              style={{ fontFamily: 'Cairo', letterSpacing: '1px' }}>
              {dateTime}
            </div>

            {/* اسم العميل الكامل (مع الحجم الديناميكي بين 12px و 20px) */}
            <div
              className="text-center font-bold leading-snug px-1"
              style={{ fontSize: `${fontSize}px` }}
            >
              {customerName}
            </div>
          </div>

          {/* رقم العقد الرئيسي للعميل (236) - 180px, Impact font, 1px letter spacing */}
          <div className="mt-2 border border-black rounded-3xl h-44 flex items-center justify-center bg-white overflow-hidden">
            <span
              className="font-black leading-none"
              style={{
                fontSize: '180px',
                fontFamily: numberFontFamily,
                letterSpacing: '1px',
              }}
            >
              {contractNo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Print({ ticket = {}, companySettings = {} }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => window.print();
  const handleClose = () => window.close();

  // Data Extraction & Western Digits normalization
  const toWesternDigits = (str) => {
    if (!str) return "";
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return String(str).replace(/[٠-٩]/g, (d) => arabicDigits.indexOf(d));
  };

  const smallCount = String(ticket.pallet_balances?.small ?? 140);
  const largeCount = String(ticket.pallet_balances?.large ?? 120);
  const sequenceNo = String(ticket.daily_sequence || 1).padStart(2, '0');
  const contractNo = ticket.contract_number_suffix || "236";
  const driverName = ticket.driver_name || "خليل رضوان";
  const estimatedLoad = ticket.estimated_load || "";
  const dateTime = toWesternDigits(ticket.day_time_str || "Wed – 13:43:25");
  const customerName = ticket.customer?.name || "عبد العزيز عبد الله مازن مريد الشمري";
  const gregorianDate = toWesternDigits(ticket.ticket_date || "05/08/2026");
  const hijriDate = toWesternDigits(ticket.date_hijri || "22/03/1448");

  return (
    <div className="min-h-screen bg-gray-200 p-4 sm:p-8 font-sans flex flex-col items-center justify-center">
      <Head title={`طباعة ورقة الانتظار: ${sequenceNo}`} />

      {/* Print Control Bar - Hidden when printing */}
      <div className="print:hidden mb-6 flex justify-between items-center bg-white p-3 border border-gray-300 rounded-xl w-full max-w-[540px] shadow-sm">
        <span className="text-xs font-bold text-gray-800">
          معاينة ورقة الانتظار (استيكر 10 × 15 سم)
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={route("queue-tickets.index")}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة إلى قائمة التذاكر</span>
          </Link>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>طباعة الاستيكر</span>
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-all"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>

      {/* Waiting Ticket Container */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none print:m-0 print:p-4" dir="ltr">
        <WaitingTicketDocument
          smallCount={smallCount}
          largeCount={largeCount}
          sequenceNo={sequenceNo}
          contractNo={contractNo}
          driverName={driverName}
          estimatedLoad={estimatedLoad}
          dateTime={dateTime}
          customerName={customerName}
          gregorianDate={gregorianDate}
          hijriDate={hijriDate}
        />
      </div>

      {/* Print CSS Rules */}
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
                
                @media print {
                    @page {
                        size: 15cm 10cm landscape;
                        margin: 0;
                    }
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
    </div>
  );
}
