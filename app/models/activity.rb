class Activity < ApplicationRecord
  belongs_to :user

  KINDS = {
    1 => "Melhoria",
    2 => "Bug", 
    3 => "Spike",
    4 => "Documentação",
    5 => "Reunião"
  }.freeze

  URGENCIES = {
    1 => "Alta",
    2 => "Média", 
    3 => "Baixa"
  }.freeze

  PRIORITIES = URGENCIES

  def kind_value
    KINDS[self.kind]
  end

  def urgency_value
    URGENCIES[self.urgency]
  end

  def priority_value
    PRIORITIES[self.priority]
  end

  # Ransack Config
  def self.ransackable_attributes(auth_object = nil)
    %w[title description status start_date end_date kind completed_percent priority urgency points user_id created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[user]
  end
end
