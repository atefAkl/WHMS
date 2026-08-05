import qz from 'qz-tray';

/**
 * QZ Tray Direct ZPL Printing Service for Zebra Thermal Printers
 */
export async function printZplDirectly(zplCode, printerName = 'Zebra') {
    try {
        // Connect to QZ Tray websocket if not connected
        if (!qz.websocket.isActive()) {
            await qz.websocket.connect({
                retries: 2,
                delay: 1,
            });
        }

        // Find Zebra printer by keyword or fallback to default
        let printer = null;
        try {
            printer = await qz.printers.find(printerName);
        } catch (e) {
            console.warn(`Printer matching "${printerName}" not found, trying default printer...`);
            printer = await qz.printers.getDefault();
        }

        if (!printer) {
            throw new Error('لم يتم العثور على طابعة زيبرا موصلة برمز ' + printerName);
        }

        // Create printer config
        const config = qz.configs.create(printer, {
            encoding: 'UTF-8',
        });

        // Data payload (raw ZPL string)
        const data = [zplCode];

        // Send raw print job
        await qz.print(config, data);
        console.log(`✅ تمت الطباعة الحرارية المباشرة بنجاح على الطابعة: ${printer}`);
        return { success: true, printer };
    } catch (error) {
        console.error('❌ خطأ في الطباعة الحرارية عبر QZ Tray:', error);
        return { success: false, error: error.message || String(error) };
    }
}
