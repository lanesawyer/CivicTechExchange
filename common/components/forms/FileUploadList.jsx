// @flow

import React from 'react';
import type { FileUploadData } from '../common/upload/FileUploadButton.jsx'
import type { FileInfo } from '../common/FileInfo.jsx'
import Visibility from '../common/Visibility.jsx'
import FileUploadButton from '../common/upload/FileUploadButton.jsx'
import ConfirmationModal from '../common/confirmation/ConfirmationModal.jsx'
import { deleteFromS3 } from '../utils/s3.js'
import _ from 'lodash'

type Props = {|
  files: Array<FileInfo>,
  elementid: string
|};
type State = {|
  showDeleteModal: boolean,
  fileToDelete: FileInfo,
  files: Array<FileInfo>
|};

/**
 * Allows uploading list of files
 */
class FileUploadList extends React.PureComponent<Props,State>  {
  constructor(props: Props): void {
    super(props);
    this.state = {
      files: this.props.files || [],
      showDeleteModal: false,
      fileToDelete: null
    };
  }
  
  componentWillReceiveProps(nextProps: Props): void {
    if(nextProps.files) {
      this.setState({files: nextProps.files || []});
      this.updateHiddenField();
    }
  }
  
  updateHiddenField(): void {
    this.refs.hiddenFormField.value = JSON.stringify(this.state.files);
  }
  
  askForDeleteConfirmation(fileToDelete: FileInfo): void {
    this.setState({
      fileToDelete: fileToDelete,
      showDeleteModal: true
    })
  }
  
  confirmDelete(confirmed: boolean): void {
    if(confirmed) {
      _.remove(this.state.files, (file) => file.publicUrl + file.id === this.state.fileToDelete.publicUrl + this.state.fileToDelete.id);
      deleteFromS3(this.state.fileToDelete.key);
    }
  
    this.updateHiddenField();
    
    this.setState({
      showDeleteModal: false,
      fileToDelete: null
    })
  }
  
  handleFileSelection(fileUploadData: FileUploadData): void {
    var fileInfo = _.assign({ visibility: Visibility.PUBLIC }, fileUploadData);
    this.state.files.push(fileInfo);
    this.updateHiddenField();
    this.forceUpdate();
  }
  
  render(): React$Node {
    return (
      <div>
        <input type="hidden" ref="hiddenFormField" id={this.props.elementid} name={this.props.elementid}/>
        
        <FileUploadButton
          acceptedFileTypes="*"
          buttonText="Project Files"
          iconClass="fa fa-plus"
          onFileUpload={this.handleFileSelection.bind(this)}
        />

        {this._renderFiles()}
        
        <ConfirmationModal
          showModal={this.state.showDeleteModal}
          message="Do you want to delete this file?"
          onSelection={this.confirmDelete.bind(this)}
        />
      </div>
    );
  }
  
  _renderFiles(): Array<React$Node> {
    return this.state.files.map((file,i) =>
      <div key={i}>
        <a href={file.publicUrl} target="_blank" rel="noopener noreferrer">{file.fileName}</a>
        <i className="fa fa-trash-o fa-1" aria-hidden="true" onClick={this.askForDeleteConfirmation.bind(this,file)}></i>
      </div>
    );
  }
}

export default FileUploadList;