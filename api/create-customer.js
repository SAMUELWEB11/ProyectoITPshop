/**
 * Vercel Serverless Function: Proxy Seguro para Crear Clientes (Customer)
 * * Esta función recibe los datos del nuevo usuario desde el frontend 
 * y realiza una petición POST autenticada a ERPNext para crear un DocType Customer.
 * Protege el API Key/Secret.
 */

// Se asume que las Variables de Entorno están configuradas en Vercel:
// ERP_API_KEY, ERP_API_SECRET, ERP_BASE_URL (ver Guide_ERPNext_Security.md)
const API_KEY = process.env.ERP_API_KEY;
const API_SECRET = process.env.ERP_API_SECRET;
const BASE_URL = process.env.ERP_BASE_URL;

const CUSTOMER_API_PATH = '/api/resource/Customer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Only POST is accepted.' });
    }

    if (!API_KEY || !API_SECRET || !BASE_URL) {
        return res.status(500).json({ error: 'Server configuration error: Missing ERP credentials.' });
    }

    try {
        // El frontend debe enviar un objeto JSON con los datos del cliente, por ejemplo:
        // { 'customer_name': 'Juan Perez', 'customer_type': 'Individual', 'email_id': 'juan.perez@example.com' }
        const customerData = req.body; 

        if (!customerData || !customerData.customer_name) {
            return res.status(400).json({ error: 'Missing customer data (e.g., customer_name) in request body.' });
        }

        const fullUrl = `${BASE_URL}${CUSTOMER_API_PATH}`;

        // 1. La función Serverless añade la autenticación secreta
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Autenticación de cabecera segura
                'Authorization': `token ${API_KEY}:${API_SECRET}` 
            },
            // El cuerpo de la petición contiene el objeto DocType Customer de ERPNext
            body: JSON.stringify(customerData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            // Devuelve el error de ERPNext sin exponer credenciales
            console.error('ERPNext API Error on Customer Creation:', responseData);
            return res.status(response.status).json({ 
                error: 'Failed to create Customer in ERPNext.',
                details: responseData.exc || responseData
            });
        }

        // 2. Devuelve la respuesta exitosa (el nuevo Customer Doc) al cliente React
        res.status(200).json({ 
            message: 'Customer created successfully.',
            customer: responseData.data 
        });

    } catch (error) {
        console.error('Proxy Customer Creation Error:', error);
        res.status(500).json({ error: 'Internal Server Error during Customer creation.' });
    }
}
