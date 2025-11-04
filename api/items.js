/**
 * Vercel Serverless Function para obtener la lista de artículos (Items) desde ERPNext.
 *
 * Esta función consulta el punto final /api/resource/Item de ERPNext
 * utilizando las credenciales seguras almacenadas en variables de entorno.
 *
 * RUTA ESPERADA EN VERCEL: /api/items
 */

// AVISO DE SEGURIDAD CRÍTICO:
// **********************************************************************************************
// ESTOS VALORES ESTÁN HARDCODEADOS SÓLO PARA PRUEBAS LOCALES O PETICIÓN EXPRESA DEL USUARIO.
// EN PRODUCCIÓN, DEBEN ELIMINARSE Y CONFIGURARSE EXCLUSIVAMENTE COMO VARIABLES DE ENTORNO EN VERCEL.
// **********************************************************************************************
const ERP_URL = 'https://itpshoppue.v.erpnext.com/';
const ERP_API_KEY = '81b15af7d859103';
const ERP_API_SECRET = 'a8478a4391b42bc'; 

// Campos a solicitar de cada artículo. Esto es crucial para el front-end.
const itemFields = [
    'item_code',
    'item_name',
    'standard_rate', // El precio de venta
    'image',         // La URL de la imagen del artículo
    'description',   // Opcional: para mostrar en la página de detalle
].join(', ');


module.exports = async (req, res) => {
    // 1. Validación de Método
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed', message: 'Only GET requests are supported on this endpoint.' });
    }

    // 2. Validación de Credenciales (solo como fallback si se usan variables de entorno)
    // Si los valores están hardcodeados arriba, esta validación es menos crítica, pero se mantiene por seguridad.
    if (!ERP_URL || !ERP_API_KEY || !ERP_API_SECRET) {
        console.error('Missing ERPNext configuration.');
        return res.status(500).json({ error: 'Server Configuration Error', message: 'ERPNext credentials are not configured.' });
    }

    // 3. Construcción de la URL de ERPNext
    // Filtros:
    // 1. "is_sales_item" = 1 (Solo artículos marcados para venta)
    // 2. "has_variants" = 0 (Excluimos variantes para simplificar)
    // 3. "disabled" = 0 (Solo artículos activos)
    const erpNextApiUrl = `${ERP_URL}/api/resource/Item?fields=[${itemFields}]&filters=[["is_sales_item", "=", 1], ["has_variants", "=", 0], ["disabled", "=", 0]]&limit_page_length=50`;

    try {
        // 4. Llamada a ERPNext con Autenticación
        const response = await fetch(erpNextApiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `token ${ERP_API_KEY}:${ERP_API_SECRET}`,
                'Content-Type': 'application/json',
            },
        });

        // 5. Manejo de Respuesta HTTP
        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`ERPNext API Error: ${response.status} - ${errorDetails}`);
            return res.status(response.status).json({ 
                error: 'ERPNext API Request Failed', 
                status: response.status,
                details: errorDetails 
            });
        }

        // 6. Extracción y Retorno de Datos
        const data = await response.json();
        
        // La respuesta de ERPNext viene dentro de la propiedad 'data'. 
        return res.status(200).json({ items: data.data });

    } catch (error) {
        console.error('Serverless function execution error:', error.message);
        return res.status(500).json({ 
            error: 'Internal Server Error', 
            message: error.message 
        });
    }
};
