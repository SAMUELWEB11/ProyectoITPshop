/**
 * Vercel Serverless Function para crear un Pedido de Venta (Sales Order) en ERPNext.
 *
 * Esta función recibe un payload de carrito (Sales Order) desde el front-end 
 * y lo envía a ERPNext para su creación, utilizando las credenciales seguras.
 *
 * RUTA ESPERADA EN VERCEL: /api/create-sales-order
 */

// AVISO DE SEGURIDAD CRÍTICO:
// **********************************************************************************************
// ESTOS VALORES ESTÁN HARDCODEADOS SÓLO PARA PRUEBAS LOCALES O PETICIÓN EXPRESA DEL USUARIO.
// EN PRODUCCIÓN, DEBEN ELIMINARSE Y CONFIGURARSE EXCLUSIVAMENTE COMO VARIABLES DE ENTORNO EN VERCEL.
// **********************************************************************************************
const ERP_URL = 'https://itpshoppue.v.erpnext.com/';
const ERP_API_KEY = '81b15af7d859103';
const ERP_API_SECRET = 'a8478a4391b42bc'; 

// CRÍTICO ACTUALIZADO: Usamos 'Stores - ITPS' como el almacén de donde salen los productos.
const DEFAULT_WAREHOUSE = 'Stores - ITPS';


module.exports = async (req, res) => {
    // 1. Validación de Método
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed', message: 'Only POST requests are supported on this endpoint.' });
    }

    // 2. Validación de Credenciales (usando hardcodeado o variables de entorno)
    if (!ERP_URL || !ERP_API_KEY || !ERP_API_SECRET) {
        console.error('Missing ERPNext configuration.');
        return res.status(500).json({ error: 'Server Configuration Error', message: 'ERPNext credentials are not configured.' });
    }

    let salesOrderPayload = req.body;
    
    if (!salesOrderPayload || !salesOrderPayload.customer || !salesOrderPayload.items) {
        return res.status(400).json({ error: 'Bad Request', message: 'Missing required fields (customer or items) in payload.' });
    }
    
    // 3. Modificación CRÍTICA del Payload: Agregar el Almacén por defecto
    // ERPNext requiere un Almacén (Warehouse) de donde se venderá el ítem.
    const itemsWithWarehouse = salesOrderPayload.items.map(item => ({
        ...item,
        warehouse: DEFAULT_WAREHOUSE // AHORA ES 'Stores - ITPS'
    }));
    
    salesOrderPayload = {
        ...salesOrderPayload,
        items: itemsWithWarehouse
    };

    // *******************************************************************
    // Log para depuración. Esto mostrará lo que se envía a ERPNext.
    console.log('--- Sales Order Payload Recibido para ERPNext ---');
    console.log(JSON.stringify(salesOrderPayload, null, 2));
    console.log('---------------------------------------------------');
    // *******************************************************************

    const erpNextApiUrl = `${ERP_URL}/api/resource/Sales Order`;

    try {
        // 4. Llamada a ERPNext para crear el Pedido de Venta
        const response = await fetch(erpNextApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `token ${ERP_API_KEY}:${ERP_API_SECRET}`,
                'Content-Type': 'application/json',
            },
            // El cuerpo debe ser un objeto 'doc' que contiene el payload del Sales Order
            body: JSON.stringify({ doc: salesOrderPayload }), 
        });

        // 5. Manejo de Respuesta HTTP
        const data = await response.json();

        if (!response.ok) {
            // ERPNext a menudo retorna el error dentro de la propiedad 'exc' (Exception)
            const errorText = data.exc ? JSON.parse(data.exc).join('\n') : (data.message || 'Unknown ERPNext error');
            
            console.error('ERPNext Sales Order Creation Error:', errorText);
            
            return res.status(response.status).json({ 
                error: 'Failed to create Sales Order in ERPNext', 
                details: errorText,
                sent_payload: salesOrderPayload
            });
        }

        // 6. Éxito: Retorno del documento creado
        return res.status(200).json({ 
            message: 'Sales Order created successfully', 
            sales_order: data.data // Contiene el documento creado
        });

    } catch (error) {
        console.error('Serverless function execution error:', error.message);
        return res.status(500).json({ 
            error: 'Internal Server Error', 
            message: error.message 
        });
    }
};
