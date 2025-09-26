# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

users = [
  { name: "João Silva" },
  { name: "Maria Santos" },
  { name: "Pedro Oliveira" },
  { name: "Ana Costa" }
]

users.each do |user_attrs|
  User.find_or_create_by!(name: user_attrs[:name])
end

activities = [
  {
    title: "Implementar sistema de filtros",
    description: "Criar funcionalidade de filtros avançados para a listagem de atividades",
    status: true,
    start_date: Date.current,
    end_date: Date.current + 7.days,
    kind: 1, # Melhoria
    completed_percent: 75.0,
    priority: 1,
    urgency: 1, # Alto
    points: 8,
    user: User.find_by(name: "João Silva")
  },
  {
    title: "Corrigir bug no login",
    description: "Usuários não conseguem fazer login com caracteres especiais",
    status: false,
    start_date: Date.current - 2.days,
    end_date: Date.current + 3.days,
    kind: 2, # Bug
    completed_percent: 30.0,
    priority: 2,
    urgency: 1, # Alto
    points: 5,
    user: User.find_by(name: "Maria Santos")
  },
  {
    title: "Pesquisar nova tecnologia",
    description: "Avaliar viabilidade de implementar React no frontend",
    status: true,
    start_date: Date.current - 5.days,
    end_date: Date.current + 10.days,
    kind: 3, # Spike
    completed_percent: 60.0,
    priority: 3,
    urgency: 2, # Médio
    points: 3,
    user: User.find_by(name: "Pedro Oliveira")
  },
  {
    title: "Documentar API",
    description: "Criar documentação completa da API REST",
    status: false,
    start_date: Date.current + 1.day,
    end_date: Date.current + 14.days,
    kind: 4, # Documentação
    completed_percent: 0.0,
    priority: 4,
    urgency: 3, # Baixo
    points: 2,
    user: User.find_by(name: "Ana Costa")
  },
  {
    title: "Reunião de planejamento",
    description: "Definir roadmap do próximo trimestre",
    status: true,
    start_date: Date.current,
    end_date: Date.current,
    kind: 5, # Reunião
    completed_percent: 100.0,
    priority: 1,
    urgency: 2, # Médio
    points: 1,
    user: User.find_by(name: "João Silva")
  }
]

activities.each do |activity_attrs|
  Activity.find_or_create_by!(title: activity_attrs[:title]) do |activity|
    activity.assign_attributes(activity_attrs)
  end
end
