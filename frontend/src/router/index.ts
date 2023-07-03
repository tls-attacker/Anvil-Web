import { createRouter, createWebHistory } from 'vue-router'
import Compare from '../views/Compare.vue'
import Controller from '../views/Controller.vue'
import Tests from '../views/Tests.vue'
import TestDetails from '../views/TestDetails.vue'
import TestResults from '../views/TestResults.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/compare/:identifiers*',
      name: 'compare',
      component: Compare
    },
    {
      path: '/controller',
      name: 'controller',
      component: Controller
    },
    {
      path: '/',
      name: 'tests',
      component: Tests
    },
    {
      path: '/tests/:identifier',
      name: 'testdetails',
      component: TestDetails
    },
    {
      path: '/tests/:identifier/:className/:methodName',
      name: 'TestResults',
      component: TestResults
    }
  ]
})

export default router
