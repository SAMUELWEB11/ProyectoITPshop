/**
 * Vercel Serverless Function: Proxy Seguro para Crear un Pedido de Venta (Sales Order)
 * * PROPÓSITO: Esta función se invoca al hacer clic en "Proceder al Pago" en el frontend.
 * Recibe el JSON del carrito/pedido, añade las credenciales secretas (ERP_API_KEY, ERP_API_SECRET) 
 * y realiza la petición POST a la API de ERPNext para crear el Sales Order.
 */

// Las credenciales de ERPNext se leen de las Variables de Entorno de Vercel (Configuración Segura)
const ERP_URL = 'https://itpshoppue.v.erpnext.com/';
const ERP_API_KEY = '81b15af7d859103';
const ERP_API_SECRET = 'a8478a4391b42bc';

const SALES_ORDER_API_PATH = '/api/resource/Sales Order';

export default async function handler(req, res) {
    // 1. Validar el método de petición
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido. Solo se acepta POST.' });
    }

    // 2. Validar configuración de credenciales
    if (!API_KEY || !API_SECRET || !BASE_URL) {
        // Este error ocurre si olvidaste configurar las variables en el panel de Vercel
        return res.status(500).json({ error: 'Error de configuración del servidor: Faltan credenciales de ERPNext.' });
    }

    try {
        const salesOrderPayload = req.body; 

        // 3. Validar el contenido de la petición (mínimo necesario para un Sales Order)
        if (!salesOrderPayload || !salesOrderPayload.customer || !salesOrderPayload.items) {
            return res.status(400).json({ error: 'Datos de pedido incompletos. Se requieren customer e items.' });
        }

        const fullUrl = `${BASE_URL}${SALES_ORDER_API_PATH}`;

        // 4. Realizar la petición a ERPNext con la autenticación secreta
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // AÑADIR el token de autenticación (API Key/Secret) de forma SEGURA aquí
                'Authorization': `token ${API_KEY}:${API_SECRET}` 
            },
            // El cuerpo contiene el objeto DocType Sales Order (preparado en React)
            body: JSON.stringify(salesOrderPayload)
        });

        const responseData = await response.json();

        // 5. Manejar la respuesta de ERPNext
        if (!response.ok) {
            // Si ERPNext devuelve un error (ej. artículo no existe), lo enviamos al frontend
            console.error('Error de API en Creación de Pedido:', responseData);
            return res.status(response.status).json({ 
                error: 'Fallo al crear el Pedido de Venta en ERPNext.',
                details: responseData.exc || responseData // Devuelve el detalle del error de ERPNext
            });
        }

        // 6. Éxito: Devolver la confirmación y el número de pedido al frontend
        res.status(200).json({ 
            message: 'Pedido de Venta creado exitosamente.',
            sales_order: responseData.data 
        });

    } catch (error) {
        // Error de red o error de servidor inesperado
        console.error('Error de Proxy:', error);
        res.status(500).json({ error: 'Error interno del servidor durante la creación del Pedido.' });
    }
}
