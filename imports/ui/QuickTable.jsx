import React, {Component, PropTypes} from 'react';

export default class QuickTable extends Component {
    constructor() {
        super();
        this.mapSubmissions = this.mapSubmissions.bind(this);
        this.mapHeadings = this.mapHeadings.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    mapHeadings() {
        return (
            <tr >
                {
                    Object.keys(this.props.schema).map(
                        (val, idx) => (<th className="WBRedBackground" key={idx}>{this.props.schema[val]}</th>)
                    )
                }
            </tr>
        );
    }

    onClick(e) {
        this.props.clickFunc(e.target.attributes.name.value);
    }

    // If a clickFunc prop was passed, apply it
    mapSubmissions(obj, index) {
        if (this.props.clickFunc) {
            return (
                <tr key={index}  onClick={this.onClick} className="QuickTable-clickable" style={{height: '50px'}}>
                    {
                        Object.keys(this.props.schema).map(
                            (val, idx) => (<td key={idx} name={obj.id} data-item={obj}>{obj[val]}</td>))
                    }
                </tr>
            );
        }
        return (
            <tr key={index}>
                {
                    Object.keys(this.props.schema).map(
                        (val, idx) => (<td key={idx}>{obj[val]}</td>)
                    )
                }
            </tr>
        );
    }

    // Sticky header. Use CSS Transform to align headers at top as you scroll down.
    // Assumes there is only one table on the page
    // Copied from here
    // http://stackoverflow.com/questions/37071535/position-sticky-firefox-on-a-table-element
    // I chopped out the caption part.
    componentDidMount() {
        if (this.props.stickyHeaders) {
            var $win = $(window),
                $table = $('#QuickTable'),
                $thead = $table.children('thead'),
                $tfoot = $table.children('tfoot'),
                $caption = $table.children('caption'),
                $cells = $thead.children().children().add($caption);

            $win.on('scroll', function () {
                var bottom = $table.position().top + $table.height() - $thead.height() - ($tfoot.height() || 0),
                    delta = $win.scrollTop() - $thead.offset().top + $caption.outerHeight(),
                // include border thickness (minus 2)
                    vertPos = (delta < 0 || delta > bottom ? 0 : delta - 2);
                $thead.children().children().add($caption).css("transform", "translate(0px," + vertPos + "px)");
            });
        }
    }

    // Line height: 55px
    // lines per page on full screen: 18
    // $win.on ('scroll')
    // Keep a scrolling window of 54 elements
    // first Index = CEIL( $win.scrollTop() / 55 ) - 18   (make it 0 instead of negative)
    // last index = first + 54
    // Render:
    //     Spacer: TR: index * 55px
    //     displayableChildren:
    //     Spacer: TR: max - topIndex (or do I not need it)

    renderOnlyHalf() {

    }

    render() {
        return (
            <div className="QuickTable table-constrainer">
                <table className="striped" id="QuickTable">
                    <thead className="white-text" id="tyrion-table-thead">
                    {
                        this.mapHeadings()
                    }
                    </thead>
                    <tbody>
                    {
                        this.props.data && this.props.data.length
                            ? this.props.data.map(this.mapSubmissions)
                            : (<tr>
                            <td colSpan="999">Waiting for Data...</td>
                        </tr>)
                    }
                    </tbody>
                </table>
            </div>
        );
    }
}


QuickTable.propTypes = {
    schema: PropTypes.object,
    data: PropTypes.array,
    clickFunc: PropTypes.func
};


