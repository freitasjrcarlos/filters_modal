require "application_system_test_case"

class FiltersModalTest < ApplicationSystemTestCase
  test "should access the activities page" do
    visit activities_url
    assert_selector "h1", text: "Atividades"
  end

  test "should find the filter button" do
    visit activities_url
    assert_selector "button", text: "Filtrar"
  end

  test "should find filter modal elements" do
    visit activities_url
    # Check if the modal exists (even if hidden)
    assert_selector ".filters-modal"
  end

  test "should find filter operators" do
    visit activities_url
    # Check if AND/OR operators exist in the modal
    assert_selector "select", text: "E"
    assert_selector "select", text: "OU"
  end

  test "should find action buttons" do
    visit activities_url
    # Check if action buttons exist
    assert_selector "button", text: "Aplicar Filtros"
    assert_selector "button", text: "Limpar Filtros"
  end

  test "should find add group button" do
    visit activities_url
    # Check if the add group button exists
    assert_selector "button", text: "Adicionar filtro"
  end

  test "should find add grouped filter button" do
    visit activities_url
    # Check if the add grouped filter button exists
    assert_selector "button", text: "Adicionar filtro agrupado"
  end
end