// file_add_form.js
import { LitElement, html, css } from 'https://esm.run/lit';
import './array_input_field.js';
import './text_input_field.js';

class FileAddForm extends LitElement {

  static properties = {
    fieldName: { type: String, attribute: 'field-name' },
    moduleName: { type: String , attribute: 'module-name' },
    placeholder: { type: String },
  };

  constructor() {
    super();
    this.placeholder = 'Type something...';
  }


  render() {
    return html`
      <div>
        <text-input-field   field-name="id"         module-name="./file_store.js" query-limit=10 placeholder="example: dfeE#$D#$#4"></text-input-field>
        <text-input-field   field-name="type"       module-name="./file_store.js" query-limit=10 placeholder="example: dfeE#$D#$#4"></text-input-field>
        <text-input-field   field-name="cid"        module-name="./file_store.js" query-limit=10 placeholder="example: dfeE#$D#$#4"></text-input-field>
        <text-input-field   field-name="name"       module-name="./file_store.js" query-limit=10 placeholder="example: pdfsimple"></text-input-field>
        <text-input-field   field-name="content"    module-name="./file_store.js" query-limit=10 placeholder="example: dfeE#$D#$#4"></text-input-field>
        <br>
        <text-input-field   field-name="cidPath"    module-name="./file_store.js" query-limit=10 placeholder="example: dfeE#$D#$#4"></text-input-field>
        <array-input-field  field-name="size"       module-name="./file_store.js" query-limit=10 placeholder="example: abc,def,xyz"></array-input-field>
        <array-input-field  field-name="tags"       module-name="./file_store.js" query-limit=10 placeholder="example: abc,def,xyz"></array-input-field>
        ……
      </div>
    `;
  }
}

customElements.define('file-add-form', FileAddForm);

