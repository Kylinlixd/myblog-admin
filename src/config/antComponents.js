import {
  Alert,
  Avatar,
  BackTop,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  ConfigProvider,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Image,
  Input,
  Layout,
  List,
  Menu,
  Modal,
  PageHeader,
  Pagination,
  Popconfirm,
  Radio,
  Row,
  Select,
  Skeleton,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Upload
} from 'ant-design-vue'

// Components referenced by their global `a-*` template names. Composite
// components register children such as Form.Item and Input.TextArea themselves.
export const antComponents = [
  Alert,
  Avatar,
  BackTop,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  ConfigProvider,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Image,
  Input,
  Layout,
  List,
  Menu,
  Modal,
  PageHeader,
  Pagination,
  Popconfirm,
  Radio,
  Row,
  Select,
  Skeleton,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Upload
]

export function registerAntComponents(app) {
  antComponents.forEach((component) => {
    if (component.install) {
      app.use(component)
    } else {
      app.component(component.name, component)
    }
  })
}
