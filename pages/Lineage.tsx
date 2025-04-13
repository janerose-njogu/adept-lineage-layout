import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import {HierarchicLayout} from '../src/layouts/hierarchic/index';

const nodes = [
  {
    id: '1',
    position: {x: 0, y: 0},
    data: {label: 'Hello'},
    type: 'default',
  },
  {
    id: '2',
    position: {x: 200, y: 100},
    data: {label: 'World'},
    type: 'default',
  },
];

const edges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
  },
];

export default function Flow() {
  const hierarchicLayout = new HierarchicLayout();
  console.log(hierarchicLayout.arrangementPolicy);
  return (
    <div style={{width: '100%', height: '900px'}}>
      <ReactFlow nodes={nodes} edges={edges} fitView />
    </div>
  );
}
