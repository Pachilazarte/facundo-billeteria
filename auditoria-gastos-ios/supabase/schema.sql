-- Habilitar extensión UUID (Suele venir por defecto en Supabase, pero por las dudas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla Metodos de Pago
CREATE TABLE metodos_pago (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla Categorias
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    palabras_clave TEXT[] DEFAULT '{}',
    color_hex VARCHAR(7) DEFAULT '#808080', -- Opcional, para el UI del dashboard
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla Gastos
CREATE TABLE gastos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monto NUMERIC(10, 2) NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_metodo_pago UUID REFERENCES metodos_pago(id) ON DELETE SET NULL,
    id_categoria UUID REFERENCES categorias(id) ON DELETE SET NULL,
    origen VARCHAR(50) NOT NULL, -- ej: 'gas_parser', 'ios_shortcut', 'manual_web'
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para mejorar la performance en las consultas del Dashboard
CREATE INDEX idx_gastos_fecha ON gastos(fecha);
CREATE INDEX idx_gastos_id_categoria ON gastos(id_categoria);
CREATE INDEX idx_gastos_id_metodo_pago ON gastos(id_metodo_pago);

-- Inserts iniciales por defecto (Seed)
INSERT INTO metodos_pago (nombre) VALUES 
('Efectivo'),
('BNA'),
('Naranja'),
('Personal Pay');

INSERT INTO categorias (nombre, palabras_clave, color_hex) VALUES 
('Supermercado', ARRAY['coto', 'carrefour', 'vea', 'dia', 'jumbo', 'disco'], '#10b981'),
('Suscripciones', ARRAY['netflix', 'spotify', 'apple', 'icloud', 'youtube', 'amazon', 'prime'], '#8b5cf6'),
('Transporte', ARRAY['sube', 'uber', 'cabify', 'didi', 'estacionamiento', 'peaje', 'nafta', 'ypf', 'shell', 'axion'], '#f59e0b'),
('Comida / Delivery', ARRAY['pedidosya', 'rappi', 'mcdonalds', 'burger king', 'mostaza', 'starbucks', 'cafe', 'bar', 'pizzeria'], '#ef4444'),
('Kiosco / Farmacia', ARRAY['farmacity', 'kiosco', 'open25', 'farmacia'], '#06b6d4'),
('Sin clasificar', ARRAY[]::TEXT[], '#6b7280');

-- Opcional: Políticas RLS (Row Level Security)
-- Si vas a tener un solo usuario (vos), y accedés vía un API KEY de servidor
-- No es estrictamente necesario armar políticas complejas, 
-- pero por defecto cerramos el acceso anónimo si habilitas RLS.

ALTER TABLE metodos_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso total a un rol autenticado (ej. tu app Next.js usando Service Role Key)
-- CREATE POLICY "Permitir todo al backend" ON gastos FOR ALL USING (true);
