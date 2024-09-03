// file_add_form.js
// import { LitElement, html, css } from 'https://esm.run/lit';
import { LitElement, html, css } from 'lit';
import './array_input_field.js';
import './text_input_field.js';

class FileAddForm extends LitElement {

  static properties = {
    fieldName: { type: String, attribute: 'field-name' },
    idbStore: { type: String , attribute: 'idb-store' },
    placeholder: { type: String },
  };

  constructor() {
    super();
    this.placeholder = 'Type something...';
  }


  render() {
    return html`
      <div>
        <text-input-field   field-name="id"         idb-store="file" query-limit=10 placeholder="example: dfeE#$D#$#4"></text-input-field>
        <text-input-field   field-name="type"       idb-store="file" query-limit=10 placeholder="example: dfeE#$D#$#4"></text-input-field>
        <text-input-field   field-name="cid"        idb-store="file" query-limit=10 placeholder="example: dfeE#$D#$#4"></text-input-field>
        <text-input-field   field-name="name"       idb-store="file" query-limit=10 placeholder="example: pdfsimple"></text-input-field>
        <text-input-field   field-name="content"    idb-store="file" query-limit=10 placeholder="example: dfeE#$D#$#4"></text-input-field>
        <br>
        <text-input-field   field-name="cidPath"    idb-store="file" query-limit=10 placeholder="example: dfeE#$D#$#4"></text-input-field>
        <array-input-field  field-name="size"       idb-store="file" query-limit=10 placeholder="example: abc,def,xyz"></array-input-field>
        <array-input-field  field-name="tags"       idb-store="file" query-limit=10 placeholder="example: abc,def,xyz"></array-input-field>
        ……
      </div>
    `;
  }
}

customElements.define('file-add-form', FileAddForm);

