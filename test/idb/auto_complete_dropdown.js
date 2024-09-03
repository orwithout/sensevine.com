// auto_complete_dropdown.js
// import { LitElement, html, css } from 'https://esm.run/lit';
import { LitElement, html, css } from 'lit';
/*
  * 一个自动完成下拉菜单组件, 该组件包含一个输入框和一个下拉菜单
  * 输入框用于输入查询条件，下拉菜单用于显示查询结果
  * 父组件可以通过事件监听器来监听item-selected事件，以获取所选项的值，也可以通过设置parentInput属性来指定主输入框，下拉菜单将会自动改写主输入框的value属性
  * 设置parentInput属性的使用示例：
      <div>
        <input type="text" id="main-input" class="main-input" placeholder="Type something..." />
        <auto-complete-dropdown  field-name="id" idb-store="file" id="dropdown"></auto-complete-dropdown>
      </div>

      <script>
          const mainInput = document.getElementById('main-input');
          const dropdown = document.getElementById('dropdown');

          customElements.whenDefined('auto-complete-dropdown').then(() => {
              dropdown.parentInput = mainInput; // 一旦auto-complete-dropdown定义完成，设置它的parentInput属性为主输入框
          });
      </script>
*/
class AutoCompleteDropdown extends LitElement {
  static get properties() { return {  // 定义组件的属性 值被更新属性时，组件相关部分会自动重新渲染
    idbStore: { type: String, attribute: 'idb-store' },
    fieldName: { type: String, attribute: 'field-name'},
    value: { type: String },
    dropdownValue: { type: String },
    dropdownData: { type: Array },
    showDropdown: { type: Boolean },
    isValid: { type: Boolean },
    validationMessage: { type: String },
    selectedIndex: { type: Number },
    parentInput: { type: Object }, // 可以是Object，如果你打算直接传递元素引用，必须具有value属性!!!
    initialQuery: { type: String, attribute: 'initial-query' },
    queryLimit: { type: Number, attribute: 'query-limit' },
  };}

  constructor() {
    super();
    this.fieldName = '';
    this.dropdownValue = '';
    this.dropdownData = [];
    this.showDropdown = false;
    this.isValid = true;
    this.validationMessage = '';
    this.selectedIndex = -1;
    this.queryDropdownDataDebounced = this.debounce(this.queryDropdownData, 300);
    this.initialQuery = '';
    this.queryLimit = 5;
  }
  connectedCallback() { //作为组件加载时执行，可以确保能获取父组件的属性
    super.connectedCallback();
    this.loadModule();
  }
  async loadModule() {
    const modules = import.meta.glob('./*_store.js');    // 使用模式匹配导入，给与vite打包工具更多的信息
    this.dbModule = await modules[`./${this.idbStore}_store.js`]();
  }
  debounce(fn, delay = 300) { // 防抖函数，用于优化输入时的查询处理
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

static styles = css`
  .dropdown-content {
    background-color: #f9f9f9; /* 基本背景色 */
    min-width: 160px; /* 最小宽度 */
    display: none; /* 控制下拉菜单的显示 */
  }
  .dropdown-content.show {
    /*padding: 10px;  项内边距 */
    display: block; /* 显示下拉菜单 */
    text-decoration: none; /* 移除文本装饰 */
  }
  .dropdown-content div {
    cursor: pointer; /* 鼠标悬停指针样式 */
  }
  .dropdown-content div:hover, .dropdown-content .selected {
    background-color: #f1f1f1; /* 鼠标悬停和选中项的背景色 */
  }
`;


  async queryDropdownData(query) {
    if (!query) {
      this.dropdownData = [];
      return;
    }
    try {
      const results = await this.dbModule.default.queryStartsWith(this.fieldName, query, this.queryLimit);
      this.dropdownData = results;
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  }


  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
        this.dropdownValue = this.parentInput ? this.parentInput.value : this.initialQuery;  // 使用 parentInput 的 value 或 initialQuery 作为初始查询值
        this.queryDropdownDataDebounced(this.dropdownValue);  // 触发数据查询逻辑
        setTimeout(() => this.shadowRoot.getElementById('dropdown-input').focus(), 0); // Focus on dropdown input
    } else {
        this.selectedIndex = -1; // Reset selection index when closing dropdown
    }
}

  onDropdownInput(e) {
    this.dropdownValue = e.target.value;
    this.queryDropdownDataDebounced(this.dropdownValue);
    this.selectedIndex = -1; // Reset selection index on input change
  }

  onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault(); // 防止表单提交
      const selectedItemOrValue = this.selectedIndex >= 0 && this.dropdownData.length > this.selectedIndex ? this.dropdownData[this.selectedIndex] : this.dropdownValue; // Use selected item or current input value
      this.selectDropdownItem(selectedItemOrValue);
  } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedIndex = e.key === "ArrowDown" ? Math.min(this.selectedIndex + 1, this.dropdownData.length - 1) : Math.max(this.selectedIndex - 1, 0);
    }
  }

  selectDropdownItem(itemOrValue) {
    const value = typeof itemOrValue === 'string' ? itemOrValue : itemOrValue[this.fieldName];
    if (this.parentInput) {
      this.parentInput.value = value; // 条件性地更新父输入框的值
      this.parentInput.focus(); // 条件性地将输入焦点切换回父组件的输入框
    }

    this.showDropdown = false; // 关闭下拉菜单
    this.selectedIndex = -1; // 重置选中项索引

    // 触发自定义事件，通知父组件所选或输入的值
    const event = new CustomEvent('item-selected', {
      detail: value, // 将选中项的值作为事件详情传递
      bubbles: true, // 事件冒泡
      composed: true // 事件可以跨越 Shadow DOM 边界
    });
    this.dispatchEvent(event); // 触发事件
}


  render() {
    return html`
      <button @click="${this.toggleDropdown}" aria-haspopup="true" aria-expanded="${this.showDropdown ? 'true' : 'false'}">
        ${this.showDropdown ? '-' : '+'}
      </button>
      <div class="dropdown-content ${this.showDropdown ? 'show' : ''}" role="listbox" aria-labelledby="dropdownLabel">
        <input id="dropdown-input" aria-label="Filter options" type="text" .value="${this.dropdownValue}" @input="${this.onDropdownInput}" @keydown="${this.onKeyDown}" />
        ${this.dropdownData.map((item, index) => html`
          <div @click="${() => this.selectDropdownItem(item)}" class="${index === this.selectedIndex ? 'selected' : ''}" role="option" aria-selected="${index === this.selectedIndex ? 'true' : 'false'}">
            ${item[this.fieldName]}
          </div>`
        )}
      </div>
    `;
  }
}

customElements.define('auto-complete-dropdown', AutoCompleteDropdown);
