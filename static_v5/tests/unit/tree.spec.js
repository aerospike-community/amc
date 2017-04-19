import { shallow } from 'enzyme';
import jasmineEnzyme from 'jasmine-enzyme';
import Tree from 'src/components/Tree';


function expectChildren(tree, num) {
  const wrapper = shallow(<Tree node={tree} />);
  wrapper.find('.as-arrow-right').simulate('click');
  const n = wrapper.find(Tree).length;
  expect(n).toBe(num);
}

describe('<Tree />', () => {
  beforeEach(() => {
    jasmineEnzyme();
  });

  const node = {
    id: 'id',
    label: 'label',
    children: []
  };

  it('should render the label', () => {
    const wrapper = shallow(<Tree node={node} />);
    expect(wrapper.text()).toContain(node.label);
  });

  it('should not render any children by default', () => {
    const wrapper = shallow(<Tree node={node} />);
    const n = wrapper.find(Tree).length;
    expect(n).toBe(0);
  });

  it('should not render children in empty tree', () => {
    expectChildren(node, 0);
  });

  it('should render children', () => {
    const children = [];
    const tree = Object.assign({}, node, {
      children: children
    });
    for (let i = 1; i < 124; i++) {
      children.push(node);
      expectChildren(tree, i);
    }
  });

  it('should trigger callback on node click', () => {
    const spy = jasmine.createSpy('onNodeClick');
    const wrapper = shallow(<Tree node={ node } onNodeClick={ spy }/>);
    wrapper.find('span[onClick]').at(1).simulate('click');
    expect(spy).toHaveBeenCalled();
  });
});
