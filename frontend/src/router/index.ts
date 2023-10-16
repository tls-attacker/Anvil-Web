import { createRouter, createWebHistory } from 'vue-router'
import CompareView from '../views/CompareView.vue'
import ControllerView from '../views/ControllerView.vue'
import ReportList from '../views/ReportList.vue'
import ReportView from '../views/ReportView.vue'
import TestRunView from '../views/TestRunView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/compare/:identifiers*',
      name: 'compare',
      component: CompareView
    },
    {
      path: '/controller',
      name: 'Controller',
      component: ControllerView
    },
    {
      path: '/',
      name: 'ReportList',
      component: ReportList
    },
    {
      path: '/tests/:identifier',
      name: 'ReportView',
      component: ReportView
    },
    {
      path: '/tests/:identifier/:testId',
      name: 'TestRunView',
      component: TestRunView
    }
  ]
})

export default router
