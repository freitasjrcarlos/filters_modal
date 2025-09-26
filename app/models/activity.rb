class Activity < ApplicationRecord
  include Filterable
  
  belongs_to :user

  KINDS = {
    1 => "Melhoria",
    2 => "Bug", 
    3 => "Spike",
    4 => "Documentação",
    5 => "Reunião"
  }.freeze

  URGENCIES = {
    1 => "Alto",
    2 => "Médio", 
    3 => "Baixo"
  }.freeze

  def kind_value
    KINDS[self.kind]
  end

  def urgency_value
    URGENCIES[self.urgency]
  end

  # Scopes to filters
  scope :by_title, ->(title) { where("title LIKE ?", "%#{title}%") }
  scope :by_description, ->(description) { where("description LIKE ?", "%#{description}%") }
  scope :by_status, ->(status) { where(status: status) }
  scope :by_kind, ->(kind) { where(kind: kind) }
  scope :by_urgency, ->(urgency) { where(urgency: urgency) }
  scope :by_priority, ->(priority) { where(priority: priority) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_start_date, ->(date) { where(start_date: date) }
  scope :by_end_date, ->(date) { where(end_date: date) }
  scope :by_completed_percent, ->(percent) { where(completed_percent: percent) }
  scope :by_points, ->(points) { where(points: points) }
end
