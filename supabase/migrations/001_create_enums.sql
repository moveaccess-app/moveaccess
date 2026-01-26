-- ============================================
-- ENUMS DO SISTEMA MOVEACCESS
-- ============================================

-- Tipo de usuário
CREATE TYPE user_type AS ENUM ('staff', 'student');

-- Status de unidade
CREATE TYPE unit_status AS ENUM ('active', 'inactive', 'maintenance');

-- Roles padrão do sistema
CREATE TYPE role_id AS ENUM ('admin', 'manager', 'receptionist', 'financial', 'readonly');

-- Status de staff
CREATE TYPE staff_status AS ENUM ('active', 'inactive', 'pending');

-- Status de aluno
CREATE TYPE student_status AS ENUM ('active', 'inactive', 'pending', 'suspended', 'blocked');

-- Status do plano do aluno
CREATE TYPE plan_status AS ENUM ('active', 'expired', 'pending', 'suspended', 'cancelled');

-- Status de convite
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
