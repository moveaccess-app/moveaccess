/**
 * Design System Demo Page
 * Demonstrates all base components from the MoveAccess Design System
 * 
 * ⚠️ This page is for development/documentation purposes only
 */

import {
  Button,
  Input,
  Heading,
  Text,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Divider,
  Container,
  Section,
} from "@/components/ui";

export default function DesignSystemDemo() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-50 backdrop-blur">
        <Container padding="default" className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">M</span>
              </div>
              <div>
                <Heading level="h6" className="mb-0">MoveAccess</Heading>
                <Text size="xs" color="muted">Design System Demo</Text>
              </div>
            </div>
            <Badge variant="info">v1.0</Badge>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <Section spacing="large" background="none" className="bg-gradient-glow">
        <Container size="narrow">
          <div className="text-center">
            <Badge variant="outline" className="mb-6">
              Design System Foundation
            </Badge>
            <Heading level="h1" gradient className="mb-6">
              MoveAccess Design System
            </Heading>
            <Text size="lg" color="muted" className="max-w-2xl mx-auto mb-8">
              Componentes base e tokens visuais consolidados da Landing Page.
              Esta página demonstra todos os componentes disponíveis.
            </Text>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button variant="hero" size="lg">
                Ver Documentação
              </Button>
              <Button variant="hero-outline" size="lg">
                Explorar Componentes
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* Buttons Section */}
      <Section spacing="default">
        <Container size="wide">
          <Heading level="h2" className="mb-8">Buttons</Heading>
          
          <div className="space-y-8">
            <div>
              <Text weight="semibold" className="mb-4">Variantes</Text>
              <div className="flex gap-3 flex-wrap">
                <Button variant="default">Default</Button>
                <Button variant="hero">Hero</Button>
                <Button variant="hero-outline">Hero Outline</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-4">Tamanhos</Text>
              <div className="flex gap-3 items-center flex-wrap">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">→</Button>
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-4">Estados</Text>
              <div className="flex gap-3 flex-wrap">
                <Button disabled>Disabled</Button>
                <Button variant="outline" disabled>Disabled Outline</Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* Typography Section */}
      <Section spacing="default" background="muted">
        <Container size="wide">
          <Heading level="h2" className="mb-8">Typography</Heading>
          
          <div className="space-y-6">
            <div>
              <Text weight="semibold" className="mb-4">Headings</Text>
              <div className="space-y-4">
                <Heading level="h1">Heading 1</Heading>
                <Heading level="h2">Heading 2</Heading>
                <Heading level="h3">Heading 3</Heading>
                <Heading level="h4">Heading 4</Heading>
                <Heading level="h5">Heading 5</Heading>
                <Heading level="h6">Heading 6</Heading>
                <Heading level="h3" gradient>Heading with Gradient</Heading>
              </div>
            </div>

            <Divider />

            <div>
              <Text weight="semibold" className="mb-4">Text Sizes</Text>
              <div className="space-y-2">
                <Text size="xs">Extra Small Text (xs)</Text>
                <Text size="sm">Small Text (sm)</Text>
                <Text size="base">Base Text (base) - padrão</Text>
                <Text size="lg">Large Text (lg)</Text>
                <Text size="xl">Extra Large Text (xl)</Text>
              </div>
            </div>

            <Divider />

            <div>
              <Text weight="semibold" className="mb-4">Text Weights & Colors</Text>
              <div className="space-y-2">
                <Text weight="normal">Normal Weight</Text>
                <Text weight="medium">Medium Weight</Text>
                <Text weight="semibold">Semibold Weight</Text>
                <Text weight="bold">Bold Weight</Text>
                <Text color="default">Default Color</Text>
                <Text color="muted">Muted Color</Text>
                <Text color="primary">Primary Color</Text>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* Cards Section */}
      <Section spacing="default">
        <Container size="wide">
          <Heading level="h2" className="mb-8">Cards</Heading>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Básico</CardTitle>
                <CardDescription>
                  Card com header e description padrão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Text color="muted">
                  Conteúdo do card vai aqui. Pode incluir texto, botões, imagens, etc.
                </Text>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Glass Card</CardTitle>
                <CardDescription>
                  Card com efeito glass morphism
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Text color="muted">
                  Adicione a classe .glass para o efeito de vidro fosco.
                </Text>
              </CardContent>
            </Card>

            <Card className="shadow-glow">
              <CardHeader>
                <CardTitle>Card com Glow</CardTitle>
                <CardDescription>
                  Card com sombra brilhante
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Text color="muted">
                  Use .shadow-glow para destaque especial.
                </Text>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* Badges Section */}
      <Section spacing="default" background="muted">
        <Container size="wide">
          <Heading level="h2" className="mb-8">Badges</Heading>
          
          <div className="space-y-4">
            <div>
              <Text weight="semibold" className="mb-3">Variantes</Text>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-3">Exemplos de Uso</Text>
              <div className="flex gap-2 flex-wrap items-center">
                <Badge variant="success">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                  Ativo
                </Badge>
                <Badge variant="warning">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1" />
                  Pendente
                </Badge>
                <Badge variant="info">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
                  Em progresso
                </Badge>
                <Badge variant="outline">Tag</Badge>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* Forms Section */}
      <Section spacing="default">
        <Container size="narrow">
          <Heading level="h2" className="mb-8">Form Elements</Heading>
          
          <Card>
            <CardHeader>
              <CardTitle>Formulário de Exemplo</CardTitle>
              <CardDescription>
                Demonstração de inputs e composição de formulário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Text as="label" weight="medium" className="mb-2 block">
                    Nome
                  </Text>
                  <Input type="text" placeholder="Seu nome completo" />
                </div>
                
                <div>
                  <Text as="label" weight="medium" className="mb-2 block">
                    Email
                  </Text>
                  <Input type="email" placeholder="seu@email.com" />
                </div>
                
                <div>
                  <Text as="label" weight="medium" className="mb-2 block">
                    Senha
                  </Text>
                  <Input type="password" placeholder="••••••••" />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="default" className="flex-1">
                    Enviar
                  </Button>
                  <Button variant="outline">
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </Container>
      </Section>

      <Divider />

      {/* Containers & Layout Section */}
      <Section spacing="default" background="muted">
        <Container size="wide">
          <Heading level="h2" className="mb-8">Containers & Layout</Heading>
          
          <div className="space-y-8">
            <div>
              <Text weight="semibold" className="mb-4">Container Sizes</Text>
              <div className="space-y-4">
                <Container size="narrow" className="bg-card/50 border border-border rounded-lg p-4">
                  <Text>Container Narrow (max-w-6xl)</Text>
                </Container>
                <Container size="wide" className="bg-card/50 border border-border rounded-lg p-4">
                  <Text>Container Wide (max-w-7xl)</Text>
                </Container>
                <Container size="full" className="bg-card/50 border border-border rounded-lg p-4">
                  <Text>Container Full (sem limite)</Text>
                </Container>
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-4">Dividers</Text>
              <div className="space-y-4">
                <div>
                  <Text size="sm" color="muted" className="mb-2">Horizontal</Text>
                  <Divider orientation="horizontal" />
                </div>
                <div className="flex items-center gap-4">
                  <Text size="sm" color="muted">Vertical</Text>
                  <Divider orientation="vertical" className="h-12" />
                  <Text size="sm" color="muted">Between elements</Text>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Divider />

      {/* Colors & Effects Section */}
      <Section spacing="default">
        <Container size="wide">
          <Heading level="h2" className="mb-8">Colors & Effects</Heading>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <Text weight="semibold" className="mb-4">Gradientes</Text>
              <div className="space-y-4">
                <div className="h-24 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Text weight="bold" className="text-primary-foreground">
                    .bg-gradient-primary
                  </Text>
                </div>
                <div className="h-24 bg-gradient-glow rounded-lg flex items-center justify-center border border-border">
                  <Text weight="bold">
                    .bg-gradient-glow
                  </Text>
                </div>
                <div className="h-24 bg-card rounded-lg flex items-center justify-center">
                  <Text weight="bold" className="text-gradient">
                    .text-gradient
                  </Text>
                </div>
              </div>
            </div>

            <div>
              <Text weight="semibold" className="mb-4">Efeitos</Text>
              <div className="space-y-4">
                <div className="glass h-24 rounded-lg flex items-center justify-center">
                  <Text weight="bold">
                    .glass (morphism)
                  </Text>
                </div>
                <div className="shadow-glow bg-card h-24 rounded-lg flex items-center justify-center">
                  <Text weight="bold">
                    .shadow-glow
                  </Text>
                </div>
                <div className="shadow-card bg-card h-24 rounded-lg flex items-center justify-center">
                  <Text weight="bold">
                    .shadow-card
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 mt-20">
        <Container padding="default" className="py-12">
          <div className="text-center space-y-4">
            <Heading level="h5">MoveAccess Design System</Heading>
            <Text color="muted">
              Consulte a documentação completa em <code className="text-primary">Doc/DesignSystem.md</code>
            </Text>
            <div className="flex gap-2 justify-center">
              <Badge variant="outline">Fundação v1.0</Badge>
              <Badge variant="success">Production Ready</Badge>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
