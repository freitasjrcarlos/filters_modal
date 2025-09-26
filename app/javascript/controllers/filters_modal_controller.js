import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["modal", "groupContainer", "filterContainer"];
  static values = { 
    maxGroups: Number,
    maxFiltersPerGroup: Number 
  };

  connect() {
    this.maxGroupsValue = 4;
    this.maxFiltersPerGroupValue = 4;
    this.groupCount = 1;
    this.filterCounts = { group_1: 0 };
    
    this.kinds = {
      1: "Melhoria",
      2: "Bug", 
      3: "Spike",
      4: "Documentação",
      5: "Reunião"
    };
    
    this.urgencies = {
      1: "Alto",
      2: "Médio", 
      3: "Baixo"
    };
    
    this.priorities = {
      1: "Alta",
      2: "Média", 
      3: "Baixa"
    };
    
    this.addValidationStyles();
    this.centerOperatorOptions();
    
    this.handleKeydown = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.handleKeydown);
    
    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const hasFilters = Array.from(urlParams.entries()).some(([key, value]) => 
        key.startsWith('groups[') && value
      );
      
      if (!hasFilters) {
        const groupElement = document.getElementById('group-group_1');
        if (groupElement) {
          this.addFilterToGroup(groupElement);
        }
      }
    }, 100);
  }

  disconnect() {
    document.removeEventListener('keydown', this.handleKeydown);
  }

  addValidationStyles() {
    if (document.getElementById('filters-validation-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'filters-validation-styles';
    style.textContent = `
      .filter-invalid {
        border: 2px solid #dc3545 !important;
        border-radius: 6px !important;
        background-color: #fff5f5 !important;
        animation: shake 0.5s ease-in-out;
      }
      
      .filter-invalid .filters-select,
      .filter-invalid input {
        border-color: #dc3545 !important;
        background-color: #fff5f5 !important;
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      .validation-error-message {
        animation: fadeIn 0.3s ease-in-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    
    document.head.appendChild(style);
  }

  handleKeydown(event) {
    if (event.key === 'Escape' && this.modalTarget.classList.contains('show')) {
      this.closeModal();
    }
  }

  openModal() {
    this.modalTarget.classList.add("show");
    document.body.style.overflow = "hidden";
    
    const urlParams = new URLSearchParams(window.location.search);
    const allParams = Array.from(urlParams.entries());
    
    const hasFilters = allParams.some(([key, value]) => 
      key.startsWith('groups[') && value
    );
    
    if (hasFilters) {
      this.restoreFiltersFromUrl();
    } else {
    this.updateButtonStates();
    }
  }

  closeModal() {
    this.modalTarget.classList.remove("show");
    document.body.style.overflow = "auto";
  }

  closeModalOnBackdrop(event) {
    if (event.target === this.modalTarget) {
      this.closeModal();
    }
  }

  addGroup(skipAutoFilter = false) {    
    if (this.groupCount >= this.maxGroupsValue) {
      this.showLimitMessage('groups');
      return;
    }

    this.groupCount++;
    const groupId = `group_${this.groupCount}`;
    this.filterCounts[groupId] = 0;

    const groupHtml = this.createGroupHtml(groupId);
    this.groupContainerTarget.insertAdjacentHTML('beforeend', groupHtml);

    if (!skipAutoFilter) {
      const groupElement = document.getElementById(`group-${groupId}`);
      if (groupElement) {
        this.addFilterToGroup(groupElement);
      }
    }

    this.updateButtonStates();
  }

  removeGroup(event) {
    event.preventDefault();
    event.stopPropagation();

    const buttonId = event.target.id;
    
    if (!buttonId || !buttonId.startsWith('remove-group-')) {
      return;
    }
    
    const groupId = buttonId.replace('remove-group-', '');
    
    const groupElement = document.getElementById(`group-${groupId}`);
    
    if (!groupElement || groupId === 'group_1') {
      return;
    }

    const blockElement = groupElement.closest('.filters-block');
    if (blockElement) {
      blockElement.remove();
    }

    delete this.filterCounts[groupId];
    this.groupCount--;
    
    this.updateButtonStates();
  }

  addFilter(event) {
    event.preventDefault();
    event.stopPropagation();

    const buttonId = event.target.id;
    
    if (!buttonId || !buttonId.startsWith('add-filter-')) {
      return;
    }
    
    const groupId = buttonId.replace('add-filter-', '');
    
    const groupElement = document.getElementById(`group-${groupId}`);
    const filterContainer = document.getElementById(`filters-container-${groupId}`);

    if (this.filterCounts[groupId] >= this.maxFiltersPerGroupValue) {
      this.showLimitMessage('filters', groupId);
      return;
    }

    this.filterCounts[groupId]++;
    const filterId = `${groupId}_filter_${this.filterCounts[groupId]}`;

    const filterHtml = this.createFilterHtml(filterId);
    filterContainer.insertAdjacentHTML('beforeend', filterHtml);

    this.updateButtonStates();
  }

  removeFilter(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const { filterElement, groupElement } = this.getFilterElements(event);
    if (!filterElement || !groupElement) return;
    
    const { groupId, filterId } = this.extractFilterIds(filterElement, groupElement);
    const hasAppliedFilters = this.hasAppliedFilters();
    
    this.executeFilterRemoval(filterElement, groupId, filterId, hasAppliedFilters);
  }

  getFilterElements(event) {
    const filterElement = event.target.closest('.filters-filter-row');
    const groupElement = event.target.closest('.filters-group');
    return { filterElement, groupElement };
  }

  extractFilterIds(filterElement, groupElement) {
    const groupId = groupElement.dataset.groupId;
    const filterId = filterElement.id.replace('filter-row-', '');
    return { groupId, filterId };
  }

  hasAppliedFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    return Array.from(urlParams.entries()).some(([key, value]) => 
      key.startsWith('groups[') && value
    );
  }

  executeFilterRemoval(filterElement, groupId, filterId, hasAppliedFilters) {
    const removalMethod = hasAppliedFilters 
      ? () => this.removeFilterFromBackend(groupId, filterId)
      : () => this.removeFilterLocally(filterElement, groupId);
    
    removalMethod();
  }

  removeFilterLocally(filterElement, groupId) {
    filterElement.remove();
    
    if (this.filterCounts[groupId]) {
      this.filterCounts[groupId]--;
    }
    
    this.updateButtonStates();
  }

  removeFilterFromBackend(groupId, filterId) {
    const groupNumber = groupId.replace('group_', '');
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/remove_filter';
    
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'authenticity_token';
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);
    }
    
    const methodInput = document.createElement('input');
    methodInput.type = 'hidden';
    methodInput.name = '_method';
    methodInput.value = 'delete';
    form.appendChild(methodInput);
    
    const groupIdInput = document.createElement('input');
    groupIdInput.type = 'hidden';
    groupIdInput.name = 'group_id';
    groupIdInput.value = groupNumber;
    form.appendChild(groupIdInput);
    
    const filterIdInput = document.createElement('input');
    filterIdInput.type = 'hidden';
    filterIdInput.name = 'filter_id';
    filterIdInput.value = filterId;
    form.appendChild(filterIdInput);
    
    document.body.appendChild(form);
    form.submit();
  }

  updateGroupOperator(event) {
    const operator = event.target.value;
    
    const allGroupOperatorSelects = this.element.querySelectorAll('select[name*="group_operator_"]');
    allGroupOperatorSelects.forEach((select, index) => {
      select.value = operator;
      
      if (index === 0) {
        select.classList.remove('operator-disabled');
        select.classList.add('operator-editable');
        select.disabled = false;
      } else {
        select.classList.remove('operator-editable');
        select.classList.add('operator-disabled');
        select.disabled = true;
      }
    });
    
    const groupElements = this.groupContainerTarget.querySelectorAll('.filters-group');
    groupElements.forEach(group => {
      const operatorSelect = group.querySelector('.group-operator');
      if (operatorSelect) {
        operatorSelect.value = operator;
        operatorSelect.disabled = true;
      }
    });
  }

  updateFilterOperator(event) {
    const operator = event.target.value;
    const groupElement = event.target.closest('.filters-group');
    const filterOperators = groupElement.querySelectorAll('.filter-operator');
    
    filterOperators.forEach(select => {
      select.value = operator;
    });
  }

  updateFilterField(event) {
    const field = event.target.value;
    const filterRow = event.target.closest('.filters-filter-row');
    const valueContainer = filterRow.querySelector('.filters-value-container');
    
    valueContainer.removeAttribute('data-field-type');
    
    if (['kind', 'urgency', 'priority', 'user_id'].includes(field)) {
      valueContainer.setAttribute('data-field-type', 'select');
      this.renderSelectField(valueContainer, field, filterRow);
    } else if (field === 'status') {
      valueContainer.setAttribute('data-field-type', 'boolean');
      this.renderBooleanField(valueContainer, filterRow);
    } else if (['start_date', 'end_date'].includes(field)) {
      valueContainer.setAttribute('data-field-type', 'date');
      this.renderDateField(valueContainer, filterRow);
    } else {
      valueContainer.setAttribute('data-field-type', 'text');
      this.renderTextField(valueContainer, filterRow);
    }
  }

  getUsersData() {
    const usersDataElement = document.getElementById('users-data');
    
    if (usersDataElement) {
      const jsonContent = usersDataElement.textContent;
      try {
        const parsed = JSON.parse(jsonContent);
        return parsed;
      } catch (error) {
        return [];
      }
    }
    
    return [];
  }

  renderSelectField(container, field, filterRow) {
    const name = filterRow.querySelector('input[name*="[value]"]')?.name || 
                 filterRow.querySelector('select[name*="[value]"]')?.name;
    
    const existingValue = container.querySelector('input, select')?.value || '';
    
    let options = '';
    
    if (field === 'kind') {
      options = Object.entries(this.kinds)
        .map(([value, label]) => `<option value="${value}">${label}</option>`)
        .join('');
    } else if (field === 'urgency') {
      options = Object.entries(this.urgencies)
        .map(([value, label]) => `<option value="${value}">${label}</option>`)
        .join('');
    } else if (field === 'priority') {
      options = Object.entries(this.priorities)
        .map(([value, label]) => `<option value="${value}">${label}</option>`)
        .join('');
    } else if (field === 'user_id') {
      const users = this.getUsersData();
      options = users
        .map(user => `<option value="${user.id}">${user.name}</option>`)
        .join('');
    }
    
    const selectHtml = `
      <select name="${name}" class="filters-select">
        <option value="">Selecione...</option>
        ${options}
      </select>
    `;
    
    container.innerHTML = selectHtml;
    
    if (existingValue) {
      const newSelect = container.querySelector('select');
      if (newSelect) {
        newSelect.value = existingValue;
      }
    }
  }

  renderBooleanField(container, filterRow) {
    const name = filterRow.querySelector('input[name*="[value]"]')?.name || 
                 filterRow.querySelector('select[name*="[value]"]')?.name;
    
    const existingValue = container.querySelector('input, select')?.value || '';
    
    container.innerHTML = `
      <select name="${name}" class="filters-select">
        <option value="">Selecione...</option>
        <option value="true">Ativo</option>
        <option value="false">Inativo</option>
      </select>
    `;
    
    if (existingValue) {
      const newSelect = container.querySelector('select');
      if (newSelect) {
        newSelect.value = existingValue;
      }
    }
  }

  renderDateField(container, filterRow) {
    const name = filterRow.querySelector('input[name*="[value]"]')?.name || 
                 filterRow.querySelector('select[name*="[value]"]')?.name;
    
    const existingValue = container.querySelector('input, select')?.value || '';
    
    container.innerHTML = `
      <input type="date" name="${name}" class="filters-select">
    `;
    
    if (existingValue) {
      const newInput = container.querySelector('input');
      if (newInput) {
        newInput.value = existingValue;
      }
    }
  }

  renderTextField(container, filterRow) {
    const name = filterRow.querySelector('input[name*="[value]"]')?.name || 
                 filterRow.querySelector('select[name*="[value]"]')?.name;
    
    const existingValue = container.querySelector('input, select')?.value || '';
    
    container.innerHTML = `
      <input type="text" name="${name}" class="filters-select">
    `;
    
    if (existingValue) {
      const newInput = container.querySelector('input');
      if (newInput) {
        newInput.value = existingValue;
      }
    }
  }

  applyFilters() {
    if (!this.validateFilters()) {
      return;
    }
    
    const form = this.element.querySelector('form');
    const formData = new FormData(form);
    
    const filterParams = this.buildFilterParams(formData);
    
    const url = new URL(window.location);
    url.search = new URLSearchParams(filterParams).toString();
    window.location.href = url.toString();
  }

  validateFilters() {
    const filterRows = this.element.querySelectorAll('.filters-filter-row');
    
    let isValid = true;
    const invalidFilters = [];
    
    filterRows.forEach((filterRow, index) => {
      const fieldSelect = filterRow.querySelector('select[name*="[field]"]');
      const fieldValue = fieldSelect ? fieldSelect.value : '';
      
      const operatorSelect = filterRow.querySelector('select[name*="[operator]"]');
      const operatorValue = operatorSelect ? operatorSelect.value : '';
      
      const valueInput = filterRow.querySelector('input[name*="[value]"], select[name*="[value]"]');
      const inputValue = valueInput ? valueInput.value.trim() : '';
      
      const hasAnyValue = fieldValue || operatorValue || inputValue;
      
      if (hasAnyValue) {
        if (!fieldValue || !operatorValue || !inputValue) {
          invalidFilters.push(index + 1);
          isValid = false;
          
          filterRow.classList.add('filter-invalid');
          
          setTimeout(() => {
            filterRow.classList.remove('filter-invalid');
          }, 3000);
        } else {
          filterRow.classList.remove('filter-invalid');
        }
      } else {
        filterRow.classList.remove('filter-invalid');
      }
    });
    
    if (!isValid) {
      this.showValidationError(invalidFilters);
    } else {
      this.clearValidationError();
    }
    
    return isValid;
  }

  showValidationError(invalidFilters) {
    this.clearValidationError();
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'validation-error-message';
    errorMessage.style.cssText = `
      background-color: #f8d7da !important;
      border: 2px solid #dc3545 !important;
      color: #721c24 !important;
      padding: 16px 20px !important;
      border-radius: 8px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      margin: 16px 0 !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      z-index: 10000 !important;
      position: relative !important;
      width: 100% !important;
      box-sizing: border-box !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
    `;
    
    const filterText = invalidFilters.length === 1 ? 'filtro' : 'filtros';
    const filterNumbers = invalidFilters.join(', ');
    
    errorMessage.innerHTML = `
      <span>⚠️</span>
      <span>Por favor, preencha todos os campos dos ${filterText} ${filterNumbers}. Todos os campos (Campo, Operador e Valor) são obrigatórios.</span>
    `;
    
    let targetElement = null;
    
    targetElement = this.element.querySelector('.filters-modal-content');
    
    if (!targetElement) {
      targetElement = this.element.querySelector('.modal-body');
    }
    
    if (!targetElement) {
      targetElement = this.element.querySelector('.modal-content');
    }
    
    if (!targetElement) {
      targetElement = this.element.querySelector('.filters-modal');
    }
    
    if (!targetElement) {
      targetElement = this.element;
    }
    
    if (targetElement) {
      const header = targetElement.querySelector('.filters-modal-header');
      if (header && header.nextSibling) {
        targetElement.insertBefore(errorMessage, header.nextSibling);
      } else if (targetElement.firstChild) {
        targetElement.insertBefore(errorMessage, targetElement.firstChild);
      } else {
        targetElement.appendChild(errorMessage);
      }
      
      if (!targetElement.querySelector('.validation-error-message')) {
        const modal = this.element.querySelector('.filters-modal');
        if (modal) {
          modal.insertBefore(errorMessage, modal.firstChild);
        } else {
          document.body.appendChild(errorMessage);
        }
      }
    }
  }

  clearValidationError() {
    const existingError = this.element.querySelector('.validation-error-message');
    if (existingError) {
      existingError.remove();
    }
  }

  clearFilters(resetCounters = true) {
    const form = this.element.querySelector('form');
    form.reset();
    
    const groups = this.groupContainerTarget.querySelectorAll('.filters-group');
    
    groups.forEach((group, index) => {
      const groupId = group.dataset.groupId;
      
      if (index > 0) {
        group.remove();
      }
    });
    
    const firstGroup = this.groupContainerTarget.querySelector('[data-group-id="group_1"]');
    if (firstGroup) {
      const filtersContainer = firstGroup.querySelector('.filters-container');
      if (filtersContainer) {
        filtersContainer.innerHTML = '';
      }
    }
    
    if (resetCounters) {
    this.groupCount = 1;
    this.filterCounts = { group_1: 0 };
    }
    
    this.clearValidationError();
    this.updateButtonStates();
  }

  createGroupHtml(groupId) {
    const previousOperator = this.getSelectedOperator();
    const isFirstGroup = groupId === 'group_1';
    const isFirstOperator = groupId === 'group_2';
    
    return `
      <div class="filters-block" data-group-id="${groupId}">
        <div class="filters-left-section">
          <div class="filters-operator-block" id="operator-block-${groupId}">
            ${isFirstGroup ? `
              <div class="filters-where-block">
                <div class="filters-where-label">Onde</div>
              </div>
            ` : `
              <select name="group_operator_${groupId}" class="filters-operator-select ${isFirstOperator ? 'operator-editable' : 'operator-disabled'}" data-action="change->filters-modal#updateGroupOperator" ${isFirstOperator ? '' : 'disabled'}>
                <option value="AND" ${previousOperator === 'AND' ? 'selected' : ''}>E</option>
                <option value="OR" ${previousOperator === 'OR' ? 'selected' : ''}>OU</option>
              </select>
            `}
          </div>
        </div>
        
        <div class="filters-right-section">
          <div class="filters-group" data-group-id="${groupId}" id="group-${groupId}">
            <div class="filters-group-header">
              <h4 class="filters-group-title">📋 Grupo ${this.groupCount}</h4>
              <button type="button" class="filters-btn filters-btn-outline-danger" data-action="click->filters-modal#removeGroup" id="remove-group-${groupId}">
                🗑️ Remover grupo
              </button>
            </div>
            
            <div class="filters-group-operator-section">
              <label class="filters-label">Operador entre filtros:</label>
              <select name="groups[${groupId}][filter_operator]" class="filter-operator filters-select" data-action="change->filters-modal#updateFilterOperator" id="operator-${groupId}">
                <option value="AND">E (AND)</option>
                <option value="OR">OU (OR)</option>
              </select>
            </div>
            
            <div class="filters-container" id="filters-container-${groupId}">
            </div>
            
            <button type="button" class="filters-btn filters-btn-outline-primary" data-action="click->filters-modal#addFilter" id="add-filter-${groupId}">
              ➕ Adicionar filtro agrupado
            </button>
          </div>
        </div>
      </div>
    `;
  }

  createFilterHtml(filterId) {
    return `
      <div class="filters-filter-row" id="filter-row-${filterId}">
        <div class="filters-filter-grid">
          <div class="filters-filter-field">
            <label class="filters-label">Campo:</label>
            <select name="groups[${filterId.split('_')[1]}][filters][${filterId}][field]" class="filters-select" data-action="change->filters-modal#updateFilterField" id="field-${filterId}">
              <option value="title">Título</option>
              <option value="description">Descrição</option>
              <option value="status">Status</option>
              <option value="kind">Tipo</option>
              <option value="urgency">Urgência</option>
              <option value="priority">Prioridade</option>
              <option value="user_id">Usuário</option>
              <option value="start_date">Data Início</option>
              <option value="end_date">Data Término</option>
              <option value="completed_percent">% Completo</option>
              <option value="points">Pontos</option>
            </select>
          </div>
          
          <div class="filters-filter-field">
            <label class="filters-label">Operador:</label>
            <select name="groups[${filterId.split('_')[1]}][filters][${filterId}][operator]" class="filters-select" id="operator-${filterId}">
              <option value="equals">Igual</option>
              <option value="not_equals">Diferente</option>
            </select>
          </div>
          
          <div class="filters-filter-field">
            <label class="filters-label">Valor:</label>
            <div class="filters-value-container" data-field-type="text" id="value-container-${filterId}">
              <input type="text" name="groups[${filterId.split('_')[1]}][filters][${filterId}][value]" class="filters-select" id="value-${filterId}">
            </div>
          </div>
          
          <div class="filters-filter-field">
            <button type="button" class="filters-btn filters-btn-outline-danger" data-action="click->filters-modal#removeFilter" id="remove-filter-${filterId}">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }

  buildFilterParams(formData) {
    const params = {};
    
    const groupOperator = formData.get('group_operator');
    if (groupOperator) {
      params['group_operator'] = groupOperator;
    }
    
    const groups = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('groups[')) {
        const match = key.match(/groups\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]/);
        if (match) {
          const [, groupId, type, filterId, field] = match;
          
          if (!groups[groupId]) {
            groups[groupId] = { filter_operator: 'AND', filters: {} };
          }
          if (type === 'filter_operator') {
            groups[groupId].filter_operator = value;
          } else if (type === 'filters') {
            if (!groups[groupId].filters[filterId]) {
              groups[groupId].filters[filterId] = {};
            }
            groups[groupId].filters[filterId][field] = value;
          }
        }
      }
    }
        
    Object.keys(groups).forEach(groupId => {
      const group = groups[groupId];
      const filters = Object.values(group.filters).filter(filter => 
        filter.field && filter.value && filter.operator
      );
            
      if (filters.length > 0) {
        const groupNumber = groupId.replace('group_', '');
        params[`groups[${groupNumber}][filter_operator]`] = group.filter_operator;
        filters.forEach((filter, index) => {
          params[`groups[${groupNumber}][filters][${index}][field]`] = filter.field;
          params[`groups[${groupNumber}][filters][${index}][operator]`] = filter.operator;
          params[`groups[${groupNumber}][filters][${index}][value]`] = filter.value;
        });
      }
    });
    
    return params;
  }

  restoreFiltersFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const groups = this.parseUrlGroups(urlParams);
    if (Object.keys(groups).length === 0) {
      return;
    }
    
    this.clearFilters(false);
    
    this.groupCount = 1;
    this.filterCounts = {};
    
    const processGroup = (groupId, group, index) => {
      return new Promise((resolve) => {
        this.filterCounts[groupId] = group.filters ? group.filters.length : 0;
      
      if (index > 0) {
          this.addGroup(true);
      }
      
        setTimeout(() => {
          let groupElement = this.groupContainerTarget.querySelector(`[data-group-id="${groupId}"]`);
      
      if (!groupElement) {
            groupElement = this.element.querySelector(`[data-group-id="${groupId}"]`);
          }
          
          if (!groupElement) {
            groupElement = document.getElementById(`group-${groupId}`);
          }
          
          if (!groupElement) {
            resolve();
        return;
      }
      
      const filterOperatorSelect = groupElement.querySelector('select[name*="[filter_operator]"]');
      if (filterOperatorSelect && group.filter_operator) {
        filterOperatorSelect.value = group.filter_operator;
      }
      
      if (group.filters && group.filters.length > 0) {
        group.filters.forEach((filter, filterIndex) => {
          this.addFilterToGroup(groupElement);
          
          const filterRows = groupElement.querySelectorAll('.filters-filter-row');
          const newFilterRow = filterRows[filterRows.length - 1];
          
          if (newFilterRow) {
            this.populateFilterRow(newFilterRow, filter);
          }
        });
      }
          
          resolve();
        }, 100 + (index * 50)); // Delay to load group
      });
    };
    
    const processAllGroups = async () => {
      const groupIds = Object.keys(groups);
      
      for (let i = 0; i < groupIds.length; i++) {
        const groupId = groupIds[i];
        const group = groups[groupId];
        await processGroup(groupId, group, i);
      }
      
      const groupOperator = urlParams.get('group_operator');
      if (groupOperator) {
        const groupOperatorSelects = this.element.querySelectorAll('select[name*="group_operator_"]');
        groupOperatorSelects.forEach((select, index) => {
          select.value = groupOperator;
          
          if (index === 0) {
            select.classList.remove('operator-disabled');
            select.classList.add('operator-editable');
            select.disabled = false;
          } else {
            select.classList.remove('operator-editable');
            select.classList.add('operator-disabled');
            select.disabled = true;
          }
        });
      }
      
      this.updateButtonStates();
    };
    
    processAllGroups();
  }

  parseUrlGroups(urlParams) {
    const groups = {};
    
    for (const [key, value] of urlParams.entries()) {
      if (key.startsWith('groups[')) {
        let match = key.match(/groups\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]/);
        if (match) {
          let [, groupId, type, filterIndex, field] = match;
          
          if (/^\d+$/.test(groupId)) {
            groupId = `group_${groupId}`;
          }
          
          if (!groups[groupId]) {
            groups[groupId] = { filter_operator: 'AND', filters: [] };
          }
          
          if (type === 'filter_operator') {
            groups[groupId].filter_operator = value;
          } else if (type === 'filters') {
            const filterIndexNum = isNaN(filterIndex) ? groups[groupId].filters.length : parseInt(filterIndex);
            
            if (isNaN(filterIndex)) {
              groups[groupId].filters.push({});
            } else {
              if (!groups[groupId].filters[filterIndexNum]) {
                groups[groupId].filters[filterIndexNum] = {};
              }
            }
            
            const targetFilter = groups[groupId].filters[filterIndexNum];
            targetFilter[field] = value;
          }
        }
      }
    }
    
    Object.keys(groups).forEach(groupId => {
      groups[groupId].filters = groups[groupId].filters.filter(filter => 
        filter && filter.field && filter.value && filter.operator
      );
    });
    
    return groups;
  }

  addFilterToGroup(groupElement) {
    const groupId = groupElement.dataset.groupId;
    const filterContainer = groupElement.querySelector('.filters-container');
    
    if (this.filterCounts[groupId] >= this.maxFiltersPerGroupValue) {
      return;
    }

    this.filterCounts[groupId]++;
    const filterId = `${groupId}_filter_${this.filterCounts[groupId]}`;

    const filterHtml = this.createFilterHtml(filterId);
    filterContainer.insertAdjacentHTML('beforeend', filterHtml);
    
    this.updateButtonStates();
  }

  populateFilterRow(filterRow, filter) {
    const fieldSelect = filterRow.querySelector('select[name*="[field]"]');
    
    if (fieldSelect && filter.field) {
      fieldSelect.value = filter.field;
      
      fieldSelect.dispatchEvent(new Event('change'));
      
    setTimeout(() => {
      const valueInput = filterRow.querySelector('input[name*="[value]"], select[name*="[value]"]');
      
      if (valueInput && filter.value) {
        valueInput.value = filter.value;
      }
      }, 150);
    }
    
    const operatorSelect = filterRow.querySelector('select[name*="[operator]"]');
    
    if (operatorSelect && filter.operator) {
      operatorSelect.value = filter.operator;
    }
  }

  showLimitMessage(type, groupId = null) {
    let message = '';
    let targetElement = null;
    
    if (type === 'groups') {
      message = `Limite de ${this.maxGroupsValue} grupos atingido`;
      targetElement = this.element.querySelector('button[data-action*="addGroup"]');
    } else if (type === 'filters' && groupId) {
      message = `Limite de ${this.maxFiltersPerGroupValue} filtros atingido`;
      targetElement = document.getElementById(`add-filter-${groupId}`);
    }
    
    this.clearLimitMessages(type, groupId);
    
    if (message && targetElement) {
      const messageElement = document.createElement('div');
      messageElement.className = `limit-message limit-message-${type}${groupId ? `-${groupId}` : ''}`;
      messageElement.style.cssText = `
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
        white-space: nowrap;
      `;
      messageElement.innerHTML = `
        <span>⚠️</span>
        <span>${message}</span>
      `;
      
      targetElement.parentNode.insertBefore(messageElement, targetElement.nextSibling);
      
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.remove();
        }
      }, 4000);
    }
  }

  clearLimitMessages(type = null, groupId = null) {
    let selector = '.limit-message';
    
    if (type && groupId) {
      selector = `.limit-message-${type}-${groupId}`;
    } else if (type) {
      selector = `.limit-message-${type}`;
    }
    
    const existingMessages = this.element.querySelectorAll(selector);
    existingMessages.forEach(message => message.remove());
  }

  updateButtonStates() {
    this.updateAddGroupButton();
    this.updateAddFilterButtons();
  }

  updateAddGroupButton() {
    const addGroupButton = this.element.querySelector('button[data-action*="addGroup"]');
    
    if (!addGroupButton) {
      return;
    }
    
    const isAtLimit = this.groupCount >= this.maxGroupsValue;
    
    if (isAtLimit) {
      addGroupButton.disabled = true;
      addGroupButton.style.opacity = '0.5';
      addGroupButton.style.cursor = 'not-allowed';
      addGroupButton.title = `Limite de ${this.maxGroupsValue} grupos atingido`;
    } else {
      addGroupButton.disabled = false;
      addGroupButton.style.opacity = '1';
      addGroupButton.style.cursor = 'pointer';
      addGroupButton.title = `Adicionar grupo (${this.groupCount}/${this.maxGroupsValue})`;
      this.clearLimitMessages('groups');
    }
  }

  updateAddFilterButtons() {
    const addFilterButtons = this.element.querySelectorAll('[id^="add-filter-"]');
    
    addFilterButtons.forEach(button => {
      const groupId = button.id.replace('add-filter-', '');
      const isAtLimit = (this.filterCounts[groupId] || 0) >= this.maxFiltersPerGroupValue;
      
      if (isAtLimit) {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        button.title = `Limite de ${this.maxFiltersPerGroupValue} filtros atingido`;
      } else {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.title = `Adicionar filtro (${this.filterCounts[groupId] || 0}/${this.maxFiltersPerGroupValue})`;
        this.clearLimitMessages('filters', groupId);
      }
    });
  }

  getSelectedOperator() {
    const firstGroupOperatorSelect = this.element.querySelector('select[name*="group_operator_"]');
    if (firstGroupOperatorSelect) {
      return firstGroupOperatorSelect.value;
    }
    return 'AND';
  }

  centerOperatorOptions() {
    const operatorSelects = this.element.querySelectorAll('.filters-operator-select');
    operatorSelects.forEach(select => {
      const options = select.querySelectorAll('option');
      options.forEach(option => {
        option.style.textAlign = 'center';
        option.style.textAlignLast = 'center';
        option.style.padding = '8px 0';
        option.style.margin = '0';
        option.style.width = '100%';
        option.style.display = 'block';
        option.style.background = 'transparent';
      });
    });
  }
}