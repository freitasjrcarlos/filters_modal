class AddIndexesToActivities < ActiveRecord::Migration[8.0]
  def change
    # Index to common filters
    add_index :activities, :status unless index_exists?(:activities, :status)
    add_index :activities, :kind unless index_exists?(:activities, :kind)
    add_index :activities, :urgency unless index_exists?(:activities, :urgency)
    add_index :activities, :priority unless index_exists?(:activities, :priority)
    add_index :activities, :user_id unless index_exists?(:activities, :user_id)
    
    # Index to date filters
    add_index :activities, :start_date unless index_exists?(:activities, :start_date)
    add_index :activities, :end_date unless index_exists?(:activities, :end_date)
    
    # Index to numeric filters
    add_index :activities, :completed_percent unless index_exists?(:activities, :completed_percent)
    add_index :activities, :points unless index_exists?(:activities, :points)
    
    # Composite index to common queries (status + kind)
    add_index :activities, [:status, :kind] unless index_exists?(:activities, [:status, :kind])
    
    # Composite index to queries by user and date
    add_index :activities, [:user_id, :start_date] unless index_exists?(:activities, [:user_id, :start_date])
    
    # Text index
    add_index :activities, :title unless index_exists?(:activities, :title)
    add_index :activities, :description unless index_exists?(:activities, :description)
  end
end
