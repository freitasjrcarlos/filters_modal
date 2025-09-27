import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["modal", "groupContainer"];
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
      key.startsWith('q[') && value
    );
    
    if (hasFilters) {
      this.restoreFiltersFromUrl();
    } else {
      this.addFilter();
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

    this.updateOperatorsVisibility();
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
    
    this.updateOperatorsVisibility();
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
    
    this.executeFilterRemoval(filterElement, groupId, filterId);
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

  executeFilterRemoval(filterElement, groupId, filterId) {
    filterElement.remove();
    
    if (this.filterCounts[groupId]) {
      this.filterCounts[groupId]--;
    }
    
    this.updateButtonStates();
  }

  updateFilterOperator(event) {
    const operator = event.target.value;
    const groupElement = event.target.closest('.filters-group');
    const filterOperators = groupElement.querySelectorAll('.filter-operator');
    
    filterOperators.forEach(select => {
      select.value = operator;
    });
  }

  updateGroupOperator(event) {
    const operator = event.target.value;
    const groupBlock = event.target.closest('.filters-block');
    const groupId = groupBlock.dataset.groupId;
    
    const groupOperatorSelect = groupBlock.querySelector('.filters-operator-select');
    if (groupOperatorSelect) {
      groupOperatorSelect.value = operator;
    }
    
    if (groupId === 'group_2') {
      const allOperatorDisplays = this.element.querySelectorAll('.operator-readonly .operator-text');
      allOperatorDisplays.forEach(display => {
        display.textContent = operator === 'and' ? 'E' : 'OU';
      });
      
      const firstGroupOperator = this.element.querySelector('#operator-block-group_1 .filters-operator-select');
      if (firstGroupOperator) {
        firstGroupOperator.value = operator;
      }
    }
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
      <select class="filters-select" id="value-${filterRow.id.replace('filter-row-', '')}">
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
    const existingValue = container.querySelector('input, select')?.value || '';
    
    container.innerHTML = `
      <select class="filters-select" id="value-${filterRow.id.replace('filter-row-', '')}">
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
    const existingValue = container.querySelector('input, select')?.value || '';
    
    container.innerHTML = `
      <input type="date" class="filters-select" id="value-${filterRow.id.replace('filter-row-', '')}">
    `;
    
    if (existingValue) {
      const newInput = container.querySelector('input');
      if (newInput) {
        newInput.value = existingValue;
      }
    }
  }

  renderTextField(container, filterRow) {
    const existingValue = container.querySelector('input, select')?.value || '';
    
    container.innerHTML = `
      <input type="text" class="filters-select" id="value-${filterRow.id.replace('filter-row-', '')}" placeholder="Digite o valor...">
    `;
    
    if (existingValue) {
      const newInput = container.querySelector('input');
      if (newInput) {
        newInput.value = existingValue;
      }
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
      this.filterCounts = { group_1: 1 };
    }
    
    this.clearValidationError();
    this.updateOperatorsVisibility();
    this.updateButtonStates();
  }

  applyFilters() {
    if (!this.validateFilters()) {
      return;
    }
    
    const filterParams = this.buildFilterParams();
    
    const url = new URL(window.location);
    url.search = new URLSearchParams(filterParams).toString();
    window.location.href = url.toString();
  }

  createGroupHtml(groupId) {
    const groupIndex = this.groupCount - 1;
    const isFirstGroup = groupId === 'group_1';
    const isSecondGroup = groupId === 'group_2';
    
    const currentOperator = this.getCurrentGroupOperator();
    const operatorText = currentOperator === 'and' ? 'E' : 'OU';
    
    const operatorSelectHtml = isFirstGroup 
      ? `<select name="q[g][${groupIndex}][m]" class="filters-operator-select operator-editable" data-action="change->filters-modal#updateGroupOperator">
           <option value="and" ${currentOperator === 'and' ? 'selected' : ''}>E</option>
           <option value="or" ${currentOperator === 'or' ? 'selected' : ''}>OU</option>
         </select>`
      : isSecondGroup
      ? `<select name="q[g][${groupIndex}][m]" class="filters-operator-select operator-editable" data-action="change->filters-modal#updateGroupOperator">
           <option value="and" ${currentOperator === 'and' ? 'selected' : ''}>E</option>
           <option value="or" ${currentOperator === 'or' ? 'selected' : ''}>OU</option>
         </select>`
      : `<div class="filters-operator-display operator-readonly">
           <span class="operator-text">${operatorText}</span>
         </div>`;
    
    return `
      <div class="filters-block" data-group-id="${groupId}">
        <div class="filters-left-section">
          <div class="filters-operator-block" id="operator-block-${groupId}" style="display: none;">
            ${operatorSelectHtml}
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
              <select name="q[g][${groupIndex}][c][m]" class="filter-operator filters-select" data-action="change->filters-modal#updateFilterOperator" id="operator-${groupId}">
                <option value="and">E (AND)</option>
                <option value="or">OU (OR)</option>
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
    const groupId = filterId.split('_')[1];
    const groupIndex = parseInt(groupId.replace('group_', '')) - 1;
    const filterIndex = this.filterCounts[`group_${groupId}`] - 1;
    
    return `
      <div class="filters-filter-row" id="filter-row-${filterId}">
        <div class="filters-filter-grid">
          <div class="filters-filter-field">
            <label class="filters-label">Campo:</label>
            <select name="q[g][${groupIndex}][c][${filterIndex}][a][0][name]" class="filters-select" data-action="change->filters-modal#updateFilterField" id="field-${filterId}">
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
            <select name="q[g][${groupIndex}][c][${filterIndex}][a][0][p]" class="filters-select" id="operator-${filterId}">
              <option value="eq">Igual</option>
              <option value="not_eq">Diferente</option>
            </select>
          </div>
          
          <div class="filters-filter-field">
            <label class="filters-label">Valor:</label>
            <div class="filters-value-container" data-field-type="text" id="value-container-${filterId}">
              <input type="text" name="q[g][${groupIndex}][c][${filterIndex}][v][0][value]" class="filters-select" id="value-${filterId}" placeholder="Digite o valor...">
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

  getCurrentGroupOperator() {
    const group2Operator = this.element.querySelector('#operator-block-group_2 .filters-operator-select');
    if (group2Operator) {
      return group2Operator.value;
    }
    
    const group1Operator = this.element.querySelector('#operator-block-group_1 .filters-operator-select');
    if (group1Operator) {
      return group1Operator.value;
    }
    
    return 'and';
  }

  updateOperatorsVisibility() {
    const operatorBlocks = this.element.querySelectorAll('.filters-operator-block');
    
    operatorBlocks.forEach(block => {
      const groupId = block.id.replace('operator-block-', '');
      const isFirstGroup = groupId === 'group_1';
      const isSecondGroup = groupId === 'group_2';
      
      if (this.groupCount >= 2 && !isFirstGroup) {
        block.style.display = 'flex';
        
        if (isSecondGroup) {
          const select = block.querySelector('.filters-operator-select');
          const display = block.querySelector('.filters-operator-display');
          if (select) select.style.display = 'block';
          if (display) display.style.display = 'none';
        }
      } else {
        block.style.display = 'none';
      }
    });
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

  clearValidationError() {
    const existingError = this.element.querySelector('.validation-error-message');
    if (existingError) {
      existingError.remove();
    }
  }

  restoreFiltersFromUrl() {
    this.updateButtonStates();
  }

  validateFilters() {
    const filterRows = this.element.querySelectorAll('.filters-filter-row');
    let hasValidFilter = false;
    
    filterRows.forEach((filterRow) => {
      const fieldSelect = filterRow.querySelector('select[data-action*="updateFilterField"]');
      const operatorSelect = filterRow.querySelector('select[id*="operator"]');
      const valueInput = filterRow.querySelector('input[id*="value"]');
      const valueSelect = filterRow.querySelector('select[id*="value"]');
      
      const valueElement = valueInput || valueSelect;
      
      if (fieldSelect && operatorSelect && valueElement) {
        const field = fieldSelect.value;
        const operator = operatorSelect.value;
        const value = valueElement.value.trim();
        
        if (field && operator && value) {
          hasValidFilter = true;
        }
      }
    });
    
    if (!hasValidFilter) {
      this.showValidationError('Por favor, preencha pelo menos um filtro.');
      return false;
    }
    
    this.clearValidationError();
    return true;
  }

  showValidationError(message) {
    this.clearValidationError();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error-message';
    errorDiv.textContent = message;
    
    const form = this.element.querySelector('form');
    if (form) {
      form.insertBefore(errorDiv, form.firstChild);
    }
  }

  buildFilterParams() {
    const params = {};
    const groups = {};
    
    // Find all filter groups
    const groupElements = this.element.querySelectorAll('[id^="group-"]');
    
    groupElements.forEach((groupElement, groupIndex) => {
      const groupId = groupElement.id.replace('group-', '');
      
      const groupBlock = groupElement.closest('.filters-block');
      const groupOperator = groupBlock.querySelector('.filters-operator-select')?.value || 'and';
      
      const filterOperator = groupElement.querySelector('.filter-operator')?.value || 'and';
      
      const filterRows = groupElement.querySelectorAll('.filters-filter-row');
      const groupFilters = [];
      
      filterRows.forEach((filterRow) => {
        const fieldSelect = filterRow.querySelector('select[data-action*="updateFilterField"]');
        const operatorSelect = filterRow.querySelector('select[id*="operator"]');
        const valueInput = filterRow.querySelector('input[id*="value"]');
        const valueSelect = filterRow.querySelector('select[id*="value"]');
        
        const valueElement = valueInput || valueSelect;
        
        if (fieldSelect && operatorSelect && valueElement) {
          const field = fieldSelect.value;
          const operator = operatorSelect.value;
          const value = valueElement.value.trim();
          
          if (field && operator && value) {
            groupFilters.push({
              field: field,
              operator: operator,
              value: value
            });
          }
        }
      });
      
      if (groupFilters.length > 0) {
        groups[groupIndex] = {
          groupOperator: groupOperator,
          filterOperator: filterOperator,
          filters: groupFilters
        };
      }
    });
    
    // Build Ransack group parameters using the correct structure
    const groupKeys = Object.keys(groups);
    
    if (groupKeys.length > 0) {
      // Check if we need OR between groups
      const hasOrBetweenGroups = groupKeys.some(key => groups[key].groupOperator === 'or');
      
      groupKeys.forEach((groupIndex, index) => {
        const group = groups[groupIndex];
        
        // Check if we have multiple filters with the same field in this group
        const fieldCounts = {};
        group.filters.forEach(filter => {
          fieldCounts[filter.field] = (fieldCounts[filter.field] || 0) + 1;
        });
        
        const hasMultipleSameField = Object.values(fieldCounts).some(count => count > 1);
        
        if (hasMultipleSameField) {
          // Use Ransack groupings structure for multiple filters with same field
          group.filters.forEach((filter, filterIndex) => {
            params[`q[groupings][${filterIndex}][${filter.field}_${filter.operator}]`] = filter.value;
          });
          
          // Add the operator between groupings
          if (group.filters.length > 1) {
            params['q[m]'] = group.filterOperator;
          }
        } else {
          // Use the simple structure for filters with different fields
          group.filters.forEach((filter, filterIndex) => {
            const paramKey = `q[g][${index}][${filter.field}_${filter.operator}]`;
            params[paramKey] = filter.value;
          });
          
          // Add the group operator (m) for this group
          if (group.filters.length > 1) {
            params[`q[g][${index}][m]`] = group.filterOperator;
          }
        }
      });
      
      // Add the operator between groups if we have multiple groups
      if (groupKeys.length > 1) {
        params['q[m]'] = hasOrBetweenGroups ? 'or' : 'and';
      }
    }
    
    if (Object.keys(groups).length === 0) {
      const filterRows = this.element.querySelectorAll('.filters-filter-row');
      filterRows.forEach((filterRow, index) => {
        const fieldSelect = filterRow.querySelector('select[data-action*="updateFilterField"]');
        const operatorSelect = filterRow.querySelector('select[id*="operator"]');
        const valueInput = filterRow.querySelector('input[id*="value"]');
        const valueSelect = filterRow.querySelector('select[id*="value"]');
        
        const valueElement = valueInput || valueSelect;
        
        if (fieldSelect && operatorSelect && valueElement) {
          const field = fieldSelect.value;
          const operator = operatorSelect.value;
          const value = valueElement.value.trim();
          
          if (field && operator && value) {
            params[`q[${field}_${operator}]`] = value;
          }
        }
      });
    }
    
    return params;
  }
}