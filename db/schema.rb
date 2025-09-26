# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_09_26_100000) do
  create_table "activities", force: :cascade do |t|
    t.string "title"
    t.string "description"
    t.boolean "status"
    t.date "start_date"
    t.date "end_date"
    t.integer "kind"
    t.float "completed_percent"
    t.integer "priority"
    t.integer "urgency"
    t.integer "points"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["completed_percent"], name: "index_activities_on_completed_percent"
    t.index ["description"], name: "index_activities_on_description"
    t.index ["end_date"], name: "index_activities_on_end_date"
    t.index ["kind"], name: "index_activities_on_kind"
    t.index ["points"], name: "index_activities_on_points"
    t.index ["priority"], name: "index_activities_on_priority"
    t.index ["start_date"], name: "index_activities_on_start_date"
    t.index ["status", "kind"], name: "index_activities_on_status_and_kind"
    t.index ["status"], name: "index_activities_on_status"
    t.index ["title"], name: "index_activities_on_title"
    t.index ["urgency"], name: "index_activities_on_urgency"
    t.index ["user_id", "start_date"], name: "index_activities_on_user_id_and_start_date"
    t.index ["user_id"], name: "index_activities_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "activities", "users"
end
