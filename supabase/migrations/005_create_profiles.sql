-- ============================================
-- PROFILES (Perfil base de todos os usuários)
-- ============================================

CREATE TABLE profiles (
  -- ID = auth.users.id (1:1)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de usuário
  user_type user_type NOT NULL,
  
  -- Dados básicos
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  avatar_url TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);
CREATE UNIQUE INDEX idx_profiles_cpf ON profiles(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_profiles_user_type ON profiles(user_type);

-- Trigger updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÃO: Criar profile automaticamente após signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, name, email, phone)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'student'),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar profile após signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

COMMENT ON TABLE profiles IS 'Perfil base de todos os usuários (staff e students)';
COMMENT ON COLUMN profiles.id IS 'Mesmo ID do auth.users - relação 1:1';
