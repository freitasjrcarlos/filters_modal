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
    
    this.filterableFields = this.getFilterableFieldsData();
    
    this.usedFieldsByGroup = {
      '1': new Set()
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
    
    this.addValidationClearListeners();
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
    
    this.usedFieldsByGroup[groupId] = new Set();

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
    delete this.usedFieldsByGroup[groupId];
    this.groupCount--;
    
    this.updateOperatorsVisibility();
    this.updateButtonStates();
  }

  addFilter(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const buttonId = event ? event.target.id : null;
    
    let groupId;
    if (buttonId && buttonId.startsWith('add-filter-')) {
      groupId = buttonId.replace('add-filter-', '');
    } else {
      groupId = 'group_1';
    }
    
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
    // Remover campo do rastreamento antes de remover o elemento
    const selectedField = filterElement.dataset.selectedField;
    if (selectedField && this.usedFieldsByGroup[groupId]) {
      this.usedFieldsByGroup[groupId].delete(selectedField);
    }
    
    filterElement.remove();
    
    if (this.filterCounts[groupId]) {
      this.filterCounts[groupId]--;
    }
    
    // Atualizar disponibilidade de campos após remoção
    this.updateFieldAvailabilityForGroup(groupId);
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
    const filterId = filterRow.id.replace('filter-row-', '');
    const groupId = filterId.split('_')[1];
    
    // Inicializar Set para o grupo se não existir
    if (!this.usedFieldsByGroup[groupId]) {
      this.usedFieldsByGroup[groupId] = new Set();
    }
    
    // Remover campo anterior do rastreamento se existir
    const previousField = filterRow.dataset.selectedField;
    if (previousField) {
      this.usedFieldsByGroup[groupId].delete(previousField);
    }
    
    // Adicionar novo campo ao rastreamento se selecionado
    if (field) {
      this.usedFieldsByGroup[groupId].add(field);
      filterRow.dataset.selectedField = field;
    } else {
      delete filterRow.dataset.selectedField;
    }
    
    // Atualizar disponibilidade de campos apenas no grupo atual
    this.updateFieldAvailabilityForGroup(groupId);
    
    // Encontrar o tipo do campo nos dados dinâmicos
    const fieldData = this.filterableFields.find(f => f.value === field);
    const fieldType = fieldData ? fieldData.type : 'text';
    
    valueContainer.removeAttribute('data-field-type');
    valueContainer.setAttribute('data-field-type', fieldType);
    
    // Renderizar baseado no tipo dinâmico
    switch (fieldType) {
      case 'select':
        this.renderSelectField(valueContainer, field, filterRow);
        break;
      case 'boolean':
        this.renderBooleanField(valueContainer, filterRow);
        break;
      case 'date':
        this.renderDateField(valueContainer, filterRow);
        break;
      case 'number':
        this.renderNumberField(valueContainer, filterRow);
        break;
      default:
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

  getFilterableFieldsData() {
    const fieldsDataElement = document.getElementById('filterable-fields-data');
    
    if (fieldsDataElement) {
      const jsonContent = fieldsDataElement.textContent;
      try {
        const parsed = JSON.parse(jsonContent);
        return parsed;
      } catch (error) {
        console.error('Error parsing filterable fields data:', error);
        return [];
      }
    }
    
    return [];
  }

  updateFieldAvailabilityForGroup(groupId) {
    // Atualizar apenas os selects de campo do grupo específico
    const groupElement = document.getElementById(`group-${groupId}`);
    if (!groupElement) return;
    
    const fieldSelects = groupElement.querySelectorAll('select[data-action*="updateFilterField"]');
    const usedFieldsInGroup = this.usedFieldsByGroup[groupId] || new Set();
    
    fieldSelects.forEach(select => {
      const currentValue = select.value;
      const filterRow = select.closest('.filters-filter-row');
      
      // Limpar opções existentes (exceto a primeira opção vazia)
      const firstOption = select.querySelector('option[value=""]');
      select.innerHTML = '';
      if (firstOption) {
        select.appendChild(firstOption);
      }
      
      // Adicionar opções atualizadas
      this.filterableFields.forEach(field => {
        const isUsed = usedFieldsInGroup.has(field.value);
        const isCurrentField = field.value === currentValue;
        
        // Permitir o campo atual mesmo se estiver "usado" (para manter seleção)
        const shouldDisable = isUsed && !isCurrentField;
        
        const option = document.createElement('option');
        option.value = field.value;
        option.textContent = field.label + (isUsed && !isCurrentField ? ' (já utilizado neste grupo)' : '');
        
        if (shouldDisable) {
          option.disabled = true;
          option.style.color = '#6c757d';
          option.style.fontStyle = 'italic';
        }
        
        select.appendChild(option);
      });
      
      // Restaurar valor selecionado
      if (currentValue) {
        select.value = currentValue;
      }
    });
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

  renderNumberField(container, filterRow) {
    const existingValue = container.querySelector('input, select')?.value || '';
    
    container.innerHTML = `
      <input type="number" class="filters-select" id="value-${filterRow.id.replace('filter-row-', '')}" placeholder="Digite o número..." step="any">
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
    
    this.usedFieldsByGroup = {};
    
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
                <option value="and">E</option>
                <option value="or">OU</option>
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
    
    const usedFieldsInGroup = this.usedFieldsByGroup[groupId] || new Set();
    
    const fieldOptions = this.filterableFields.map(field => {
      const isUsed = usedFieldsInGroup.has(field.value);
      const disabled = isUsed ? 'disabled' : '';
      const style = isUsed ? 'style="color: #6c757d; font-style: italic;"' : '';
      return `<option value="${field.value}" ${disabled} ${style}>${field.label}${isUsed ? ' (já utilizado neste grupo)' : ''}</option>`;
    }).join('');
    
    return `
      <div class="filters-filter-row" id="filter-row-${filterId}">
        <div class="filters-filter-grid">
          <div class="filters-filter-field">
            <label class="filters-label">Campo:</label>
            <select name="q[g][${groupIndex}][c][${filterIndex}][a][0][name]" class="filters-select" data-action="change->filters-modal#updateFilterField" id="field-${filterId}">
              <option value="">Selecione um campo...</option>
              ${fieldOptions}
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
      message = `Limite máximo de ${this.maxGroupsValue} grupos atingido. Remova um grupo para adicionar outro.`;
      targetElement = this.element.querySelector('button[data-action*="addGroup"]');
    } else if (type === 'filters' && groupId) {
      message = `Limite máximo de ${this.maxFiltersPerGroupValue} filtros por grupo atingido. Remova um filtro para adicionar outro.`;
      targetElement = document.getElementById(`add-filter-${groupId}`);
    }
    
    this.clearLimitMessages(type, groupId);
    
    if (message && targetElement) {
      const messageElement = document.createElement('div');
      messageElement.className = `limit-message limit-message-${type}${groupId ? `-${groupId}` : ''}`;
      messageElement.innerHTML = `
        <span style="font-size: 16px;">🚫</span>
        <span>${message}</span>
      `;
      
      // Insert after the target element's parent container
      const container = targetElement.closest('.filters-group') || targetElement.closest('.filters-container');
      if (container) {
        container.appendChild(messageElement);
      } else {
        targetElement.parentNode.insertBefore(messageElement, targetElement.nextSibling);
      }
      
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.remove();
        }
      }, 5000);
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
      addGroupButton.title = `Limite máximo de ${this.maxGroupsValue} grupos atingido. Remova um grupo para adicionar outro.`;
      addGroupButton.style.backgroundColor = '#f8f9fa';
      addGroupButton.style.borderColor = '#dee2e6';
      addGroupButton.style.color = '#6c757d';
    } else {
      addGroupButton.disabled = false;
      addGroupButton.style.opacity = '1';
      addGroupButton.style.cursor = 'pointer';
      addGroupButton.title = `Adicionar grupo (${this.groupCount}/${this.maxGroupsValue})`;
      addGroupButton.style.backgroundColor = '';
      addGroupButton.style.borderColor = '';
      addGroupButton.style.color = '';
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
        button.title = `Limite máximo de ${this.maxFiltersPerGroupValue} filtros por grupo atingido. Remova um filtro para adicionar outro.`;
        button.style.backgroundColor = '#f8f9fa';
        button.style.borderColor = '#dee2e6';
        button.style.color = '#6c757d';
      } else {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.title = `Adicionar filtro (${this.filterCounts[groupId] || 0}/${this.maxFiltersPerGroupValue})`;
        button.style.backgroundColor = '';
        button.style.borderColor = '';
        button.style.color = '';
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
    
    const filterRows = this.element.querySelectorAll('.filters-filter-row');
    filterRows.forEach(row => {
      row.classList.remove('filter-invalid');
    });
  }

  addValidationClearListeners() {
    const formElements = this.element.querySelectorAll('input, select');
    formElements.forEach(element => {
      element.addEventListener('input', () => {
        this.clearValidationError();
      });
      element.addEventListener('change', () => {
        this.clearValidationError();
      });
    });
  }

  restoreFiltersFromUrl() {
    this.initializeUsedFields();
    this.updateButtonStates();
  }

  initializeUsedFields() {
    this.usedFieldsByGroup = {};
    
    const filterRows = this.element.querySelectorAll('.filters-filter-row');
    filterRows.forEach(filterRow => {
      const fieldSelect = filterRow.querySelector('select[data-action*="updateFilterField"]');
      if (fieldSelect && fieldSelect.value) {
        const filterId = filterRow.id.replace('filter-row-', '');
        const groupId = filterId.split('_')[1];
        
        if (!this.usedFieldsByGroup[groupId]) {
          this.usedFieldsByGroup[groupId] = new Set();
        }
        
        this.usedFieldsByGroup[groupId].add(fieldSelect.value);
        filterRow.dataset.selectedField = fieldSelect.value;
      }
    });
    
    Object.keys(this.usedFieldsByGroup).forEach(groupId => {
      this.updateFieldAvailabilityForGroup(groupId);
    });
  }

  validateFilters() {
    const filterRows = this.element.querySelectorAll('.filters-filter-row');
    let hasValidFilter = false;
    let invalidFilters = [];
    
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
        
        filterRow.classList.remove('filter-invalid');
        
        if (field && operator && value) {
          hasValidFilter = true;
        } else {
          filterRow.classList.add('filter-invalid');
          invalidFilters.push(index + 1);
        }
      }
    });
    
    if (!hasValidFilter) {
      if (filterRows.length === 0) {
        this.showValidationError('Por favor, adicione pelo menos um filtro.');
      } else if (invalidFilters.length === filterRows.length) {
        this.showValidationError('Por favor, preencha todos os campos dos filtros (Campo, Operador e Valor).');
      } else {
        this.showValidationError('Por favor, preencha pelo menos um filtro completamente.');
      }
      return false;
    }
    
    this.clearValidationError();
    return true;
  }

  showValidationError(message) {
    this.clearValidationError();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error-message';
    errorDiv.innerHTML = `
      <span style="font-size: 16px;">⚠️</span>
      <span>${message}</span>
    `;
    
    const form = this.element.querySelector('form');
    if (form) {
      form.insertBefore(errorDiv, form.firstChild);
    }
  }

  buildFilterParams() {
    const params = {};
    const groups = {};
    
    const groupElements = this.element.querySelectorAll('[id^="group-"]');
    
    groupElements.forEach((groupElement, arrayIndex) => {
      const groupId = groupElement.id.replace('group-', '');
      const groupIndex = parseInt(groupId.replace('group_', '')) - 1;
      
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
    const groupKeys = Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b));
    
    if (groupKeys.length > 0) {
      // Check if we need OR between groups
      const hasOrBetweenGroups = groupKeys.some(key => groups[key].groupOperator === 'or');
      
      groupKeys.forEach((groupIndex) => {
        const group = groups[groupIndex];
        
        // Always use the simple structure for consistency with display logic
        group.filters.forEach((filter, filterIndex) => {
          const paramKey = `q[g][${groupIndex}][${filter.field}_${filter.operator}]`;
          params[paramKey] = filter.value;
        });
        
        // Add the group operator (m) for this group
        if (group.filters.length > 1) {
          params[`q[g][${groupIndex}][m]`] = group.filterOperator;
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