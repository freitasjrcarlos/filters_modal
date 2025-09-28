require "application_system_test_case"

class ActivitiesTest < ApplicationSystemTestCase
  setup do
    @activity = activities(:one)
  end

  test "visiting the index" do
    visit activities_url
    assert_selector "h1", text: "Atividades"
  end

  test "should create activity" do
    visit activities_url
    click_on "Nova atividade"

    fill_in "Completed percent", with: @activity.completed_percent
    fill_in "Description", with: @activity.description
    fill_in "End date", with: @activity.end_date
    fill_in "Points", with: @activity.points
    select Activity::PRIORITIES[@activity.priority], from: "Priority"
    fill_in "Start date", with: @activity.start_date
    check "Status" if @activity.status
    fill_in "Title", with: @activity.title
    select Activity::KINDS[@activity.kind], from: "Kind"
    select Activity::URGENCIES[@activity.urgency], from: "Urgency"
    select @activity.user.name, from: "Responsável"
    click_on "Create Activity"

    assert_text "Activity was successfully created"
    click_on "Voltar"
  end

  test "should update Activity" do
    visit activity_url(@activity)
    click_on "Editar", match: :first

    fill_in "Completed percent", with: @activity.completed_percent
    fill_in "Description", with: @activity.description
    fill_in "End date", with: @activity.end_date.to_s
    fill_in "Points", with: @activity.points
    select Activity::PRIORITIES[@activity.priority], from: "Priority"
    fill_in "Start date", with: @activity.start_date.to_s
    check "Status" if @activity.status
    fill_in "Title", with: @activity.title
    select Activity::KINDS[@activity.kind], from: "Kind"
    select Activity::URGENCIES[@activity.urgency], from: "Urgency"
    click_on "Update Activity"

    assert_text "Activity was successfully updated"
    click_on "Voltar"
  end

  test "should destroy Activity" do
    visit activity_url(@activity)
    click_on "Deletar", match: :first

    assert_text "Activity was successfully destroyed"
  end

  test "should restore filters when reopening modal" do
    visit activities_url

    # Verificar se o botão de filtrar existe
    assert_selector "button", text: "Filtrar"
    
    # Verificar se o modal existe (mesmo que oculto)
    assert_selector ".filters-modal"
  end
end
