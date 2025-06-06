// informacion/BaseDeDesarrollo/policies-ejemplo.ts
// Script de ejemplo: Policies RLS recomendadas para Supabase (copiar y ejecutar en SQL editor)
// Incluye policies para: proyectos, gastos_proyecto, evidencias_proyecto, pagos_personal, informes_finales

export const policiesSQL = `
-- =====================
-- Tabla: proyectos
-- =====================
-- INSERT
create policy "Supervisores pueden crear proyectos"
on public.proyectos
for insert
to public
with check (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = supervisor_id
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.rol = 'supervisor'
      AND usuarios.activo = true
  )
);
-- SELECT
create policy "Supervisores pueden ver sus proyectos"
on public.proyectos
for select
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = supervisor_id
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.rol = 'supervisor'
      AND usuarios.activo = true
  )
);
-- UPDATE
create policy "Supervisores pueden actualizar proyectos"
on public.proyectos
for update
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = supervisor_id
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.rol = 'supervisor'
      AND usuarios.activo = true
  )
)
with check (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = supervisor_id
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.rol = 'supervisor'
      AND usuarios.activo = true
  )
);
-- DELETE
create policy "Supervisores pueden borrar proyectos"
on public.proyectos
for delete
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = supervisor_id
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.rol = 'supervisor'
      AND usuarios.activo = true
  )
);

-- =====================
-- Tabla: gastos_proyecto
-- =====================
-- INSERT
create policy "Usuarios pueden crear sus gastos"
on public.gastos_proyecto
for insert
to public
with check (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
-- SELECT
create policy "Usuarios pueden ver sus gastos"
on public.gastos_proyecto
for select
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
-- UPDATE
create policy "Usuarios pueden actualizar sus gastos"
on public.gastos_proyecto
for update
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
)
with check (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
-- DELETE
create policy "Usuarios pueden borrar sus gastos"
on public.gastos_proyecto
for delete
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);

-- =====================
-- Tabla: evidencias_proyecto
-- =====================
-- INSERT
create policy "Usuarios pueden crear sus evidencias"
on public.evidencias_proyecto
for insert
to public
with check (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
-- SELECT
create policy "Usuarios pueden ver sus evidencias"
on public.evidencias_proyecto
for select
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
-- UPDATE
create policy "Usuarios pueden actualizar sus evidencias"
on public.evidencias_proyecto
for update
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
)
with check (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
-- DELETE
create policy "Usuarios pueden borrar sus evidencias"
on public.evidencias_proyecto
for delete
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);

-- =====================
-- Tabla: pagos_personal
-- =====================
-- INSERT
create policy "Usuarios pueden crear sus pagos"
on public.pagos_personal
for insert
to public
with check (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
-- SELECT
create policy "Usuarios pueden ver sus pagos"
on public.pagos_personal
for select
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
-- UPDATE
create policy "Usuarios pueden actualizar sus pagos"
on public.pagos_personal
for update
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
)
with check (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
-- DELETE
create policy "Usuarios pueden borrar sus pagos"
on public.pagos_personal
for delete
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);

-- =====================
-- Tabla: informes_finales
-- =====================
-- INSERT
create policy "Usuarios pueden crear sus informes"
on public.informes_finales
for insert
to public
with check (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
-- SELECT
create policy "Usuarios pueden ver sus informes"
on public.informes_finales
for select
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
-- UPDATE
create policy "Usuarios pueden actualizar sus informes"
on public.informes_finales
for update
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
)
with check (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
-- DELETE
create policy "Usuarios pueden borrar sus informes"
on public.informes_finales
for delete
to public
using (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = created_by
      AND usuarios.auth_user_id = auth.uid()
      AND usuarios.activo = true
  )
);
`;

// Puedes copiar y pegar el contenido de policiesSQL en el editor SQL de Supabase para crear todas las policies recomendadas.
