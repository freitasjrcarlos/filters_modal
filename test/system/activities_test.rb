require "application_system_test_case"

class ActivitiesTest < ApplicationSystemTestCase
  setup do
    @activity = activities(:one)
  end

  test "visiting the index" do
    visit activities_url
    assert_selector "h1", text: "Activities"
  end

  test "should create activity" do
    visit activities_url
    click_on "New activity"

    fill_in "Completed percent", with: @activity.completed_percent
    fill_in "Description", with: @activity.description
    fill_in "End date", with: @activity.end_date
    fill_in "Points", with: @activity.points
    fill_in "Priority", with: @activity.priority
    fill_in "Start date", with: @activity.start_date
    check "Status" if @activity.status
    fill_in "Title", with: @activity.title
    fill_in "Kind", with: @activity.kind
    fill_in "Urgency", with: @activity.urgency
    click_on "Create Activity"

    assert_text "Activity was successfully created"
    click_on "Back"
  end

  test "should update Activity" do
    visit activity_url(@activity)
    click_on "Edit this activity", match: :first

    fill_in "Completed percent", with: @activity.completed_percent
    fill_in "Description", with: @activity.description
    fill_in "End date", with: @activity.end_date.to_s
    fill_in "Points", with: @activity.points
    fill_in "Priority", with: @activity.priority
    fill_in "Start date", with: @activity.start_date.to_s
    check "Status" if @activity.status
    fill_in "Title", with: @activity.title
    fill_in "Kind", with: @activity.kind
    fill_in "Urgency", with: @activity.urgency
    click_on "Update Activity"

    assert_text "Activity was successfully updated"
    click_on "Back"
  end

  test "should destroy Activity" do
    visit activity_url(@activity)
    click_on "Destroy this activity", match: :first

    assert_text "Activity was successfully destroyed"
  end

  test "should restore filters when reopening modal" do
    visit activities_url

    click_on "Filtrar"

    select "Título", from: "Campo:"
    select "Contém", from: "Operador:"
    fill_in "Valor:", with: "teste"
    
    click_on "Aplicar Filtros"
    
    assert_selector ".active-filters"
    
    click_on "Filtrar"
    
    assert_field "Valor:", with: "teste"

    click_on "Cancelar"
  end
end
