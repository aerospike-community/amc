import React from 'react';
import { render } from 'react-dom';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import classNames from 'classnames';

// AgGridPagination provides custom pagination for ag grid.
class AgGridPagination extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // to trigger redraw
      nchanges: 0
    };

    this.next = this.next.bind(this);
    this.last = this.last.bind(this);
    this.first = this.first.bind(this);
    this.previous = this.previous.bind(this);
  }

  addEventListener(gridAPI) {
    if (gridAPI === null)
      return;

    gridAPI.addEventListener('paginationChanged', () => {
      this.setState({
        // trigger redraw
        nchanges: this.state.nchanges+1
      });
    });
  }

  componentDidMount() {
    this.addEventListener(this.props.gridAPI);
  }

  componentWillReceiveProps(nextProps) {
    this.addEventListener(nextProps.gridAPI);
  }

	previous() {
    const { gridAPI } = this.props;
    gridAPI.paginationGoToPreviousPage();
	}
	
	next() {
    const { gridAPI } = this.props;
    gridAPI.paginationGoToNextPage();
  }

  first() {
    const { gridAPI } = this.props;
    gridAPI.paginationGoToFirstPage();
  }

  last() {
    const { gridAPI } = this.props;
    gridAPI.paginationGoToLastPage();
  }

  render() {
    const { gridAPI } = this.props;

    if (!gridAPI)
      return null;

    const index = gridAPI.paginationGetCurrentPage();
    const pages = gridAPI.paginationGetTotalPages();
    const psize = gridAPI.paginationGetPageSize();
    const total = gridAPI.paginationGetRowCount();

    const start = index*psize + 1;
    let end = index*psize + psize;
    if (end > total)
      end = total;

    const isFirst = index === 0;
    const isLast = end === total;

    const where = `${start} to ${end} of ${total}`;
    return (
      <div style={{display: 'inline-block'}}>
       <span style={{marginRight: 20}}> {where} </span>

       <Button title="First" size="sm" className={classNames({"as-link": !isFirst})} onClick={this.first}> 
        <i className="fa fa-angle-double-left"></i> 
       </Button>
       <Button title="Previous" size="sm" className={classNames({"as-link": !isFirst})} onClick={this.previous}> 
        <i className="fa fa-angle-left"></i> 
       </Button>

       <span style={{margin: '0 5px 0 5px'}}>
         {`Page ${index+1} of ${pages}`}
       </span>

       <Button title="Next" size="sm" className={classNames({"as-link": !isLast})} onClick={this.next}>
        <i className="fa fa-angle-right"></i> 
       </Button>
       <Button title="Last" size="sm" className={classNames({"as-link": !isLast})} onClick={this.last}>
        <i className="fa fa-angle-double-right"></i> 
       </Button>
      </div>
    );
  }
}

AgGridPagination.PropTypes = {
  // the ag-grid api of the grid instance
  gridAPI: PropTypes.object.isRequired,
};

export default AgGridPagination;

