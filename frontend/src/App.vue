<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { request } from './services/api'

const tokenKey = 'inventory-management-token'
const token = ref(localStorage.getItem(tokenKey) || '')
const darkTheme = ref(localStorage.getItem('inventory-dark-theme') === 'true')
const currentPage = ref('inventory')
const inventory = ref([])
const categories = ref([])
const users = ref([])
const departments = ref([])
const loading = ref(false)
const membersLoading = ref(false)
const saving = ref(false)
const memberSaving = ref(false)
const pageError = ref('')
const notice = ref('')
const loginError = ref('')
const searchTerm = ref('')
const memberSearchTerm = ref('')
const statusFilter = ref('all')
const departmentFilter = ref('all')
const filterOpen = ref(false)
const activeMenuId = ref(null)
const activeMemberMenuId = ref(null)
const actionMenuType = ref('')
const actionMenuItem = ref(null)
const actionMenuPosition = ref({ top: 0, left: 0 })
const deletingInventoryId = ref(null)
const deletingMemberId = ref(null)
const pageNumber = ref(1)
const pageSize = ref(5)
const memberPageNumber = ref(1)
const memberPageSize = ref(5)
const modalOpen = ref(false)
const memberModalOpen = ref(false)
const editingItem = ref(null)
const editingMember = ref(null)
const formError = ref('')
const showNewCategory = ref(false)
const newCategoryName = ref('')
const showNewDepartment = ref(false)
const newDepartmentName = ref('')

const loginForm = reactive({ username: '', password: '' })
const itemForm = reactive({
  name: '',
  serial_number: '',
  id_category: '',
  status: 'baik',
  id_user: '',
})
const memberForm = reactive({
  username: '',
  password: '',
  id_departmans: '',
  position: '',
})

const signedInUser = computed(() => {
  try {
    const payload = token.value.split('.')[1]
    if (!payload) return {}
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return {}
  }
})

const filteredInventory = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return inventory.value.filter((item) => {
    const matchesSearch = !query || [
      item.id,
      item.name,
      item.serial_number,
      item.category?.name,
      item.user?.username,
      item.user?.department?.name,
    ].some((value) => String(value ?? '').toLowerCase().includes(query))

    return matchesSearch && (
      statusFilter.value === 'all' || item.status === statusFilter.value
    )
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredInventory.value.length / pageSize.value)))
const visibleInventory = computed(() => {
  const start = (pageNumber.value - 1) * pageSize.value
  return filteredInventory.value.slice(start, start + pageSize.value)
})
const firstVisibleItem = computed(() => (
  filteredInventory.value.length ? (pageNumber.value - 1) * pageSize.value + 1 : 0
))
const lastVisibleItem = computed(() => Math.min(
  pageNumber.value * pageSize.value,
  filteredInventory.value.length,
))

const filteredUsers = computed(() => {
  const query = memberSearchTerm.value.trim().toLowerCase()

  return users.value.filter((user) => {
    const departmentName = user.department?.name || ''
    const matchesSearch = !query || [
      user.username,
      user.position,
      departmentName,
    ].some((value) => String(value ?? '').toLowerCase().includes(query))
    const matchesDepartment = departmentFilter.value === 'all'
      || String(user.id_departmans) === departmentFilter.value

    return matchesSearch && matchesDepartment
  })
})

const memberTotalPages = computed(() => Math.max(
  1,
  Math.ceil(filteredUsers.value.length / memberPageSize.value),
))
const visibleUsers = computed(() => {
  const start = (memberPageNumber.value - 1) * memberPageSize.value
  return filteredUsers.value.slice(start, start + memberPageSize.value)
})
const memberFirstVisible = computed(() => (
  filteredUsers.value.length ? (memberPageNumber.value - 1) * memberPageSize.value + 1 : 0
))
const memberLastVisible = computed(() => Math.min(
  memberPageNumber.value * memberPageSize.value,
  filteredUsers.value.length,
))

const analyticsStatuses = computed(() => [
  { key: 'baik', label: 'Barang Baik', count: inventory.value.filter((item) => item.status === 'baik').length },
  { key: 'rusak', label: 'Barang Rusak', count: inventory.value.filter((item) => item.status === 'rusak').length },
  { key: 'dilelang', label: 'Dilelang', count: inventory.value.filter((item) => item.status === 'dilelang').length },
  { key: 'tidak-di-pakai', label: 'Tidak Dipakai', count: inventory.value.filter((item) => item.status === 'tidak di pakai').length },
])
const analyticsChartMax = computed(() => {
  const largestCount = Math.max(0, ...analyticsStatuses.value.map((status) => status.count))
  return Math.max(100, Math.ceil(largestCount / 100) * 100)
})
const analyticsChartTicks = computed(() => (
  Array.from({ length: 6 }, (_, index) => analyticsChartMax.value - index * analyticsChartMax.value / 5)
))
const analyticsBars = computed(() => analyticsStatuses.value.map((status, index) => {
  const height = status.count / analyticsChartMax.value * 290
  return {
    ...status,
    x: 92 + index * 160,
    center: 142 + index * 160,
    y: 310 - height,
    height,
  }
}))

watch([searchTerm, statusFilter, pageSize], () => {
  pageNumber.value = 1
})
watch([memberSearchTerm, departmentFilter, memberPageSize], () => {
  memberPageNumber.value = 1
})

async function loadData() {
  loading.value = true
  pageError.value = ''

  try {
    const [inventoryResponse, categoryResponse, userResponse] = await Promise.all([
      request('/inventaris?page=1&limit=1000', { token: token.value }),
      request('/categories', { token: token.value }),
      request('/users', { token: token.value }),
    ])
    inventory.value = inventoryResponse.inventaris || []
    categories.value = categoryResponse.categories || []
    users.value = userResponse.users || []
    if (pageNumber.value > totalPages.value) pageNumber.value = totalPages.value
  } catch (error) {
    pageError.value = error.message
    if (error.status === 401) logout('Sesi berakhir. Silakan masuk kembali.')
  } finally {
    loading.value = false
  }
}

async function loadMembers() {
  membersLoading.value = true
  pageError.value = ''

  try {
    const [usersResponse, departmentResponse] = await Promise.all([
      request('/users', { token: token.value }),
      request('/departments', { token: token.value }),
    ])
    users.value = usersResponse.users || []
    departments.value = departmentResponse.departments || []
    if (memberPageNumber.value > memberTotalPages.value) {
      memberPageNumber.value = memberTotalPages.value
    }
  } catch (error) {
    pageError.value = error.message
    if (error.status === 401) logout('Sesi berakhir. Silakan masuk kembali.')
  } finally {
    membersLoading.value = false
  }
}

async function login() {
  loginError.value = ''

  try {
    const response = await request('/login', {
      method: 'POST',
      body: { username: loginForm.username, password: loginForm.password },
    })
    token.value = response.token
    localStorage.setItem(tokenKey, response.token)
    loginForm.password = ''
    await loadData()
  } catch (error) {
    loginError.value = error.message
  }
}

function logout(message = '') {
  token.value = ''
  localStorage.removeItem(tokenKey)
  inventory.value = []
  categories.value = []
  users.value = []
  departments.value = []
  currentPage.value = 'inventory'
  pageError.value = ''
  loginError.value = message
}

function toggleDarkTheme() {
  darkTheme.value = !darkTheme.value
  localStorage.setItem('inventory-dark-theme', String(darkTheme.value))
}

function openCreateModal() {
  editingItem.value = null
  formError.value = ''
  showNewCategory.value = false
  newCategoryName.value = ''
  Object.assign(itemForm, {
    name: '',
    serial_number: '',
    id_category: categories.value[0]?.id_category?.toString() || '',
    status: 'baik',
    id_user: '',
  })
  modalOpen.value = true
}

function openEditModal(item) {
  editingItem.value = item
  formError.value = ''
  showNewCategory.value = false
  Object.assign(itemForm, {
    name: item.name || '',
    serial_number: item.serial_number || '',
    id_category: String(item.id_category || ''),
    status: item.status || 'baik',
    id_user: item.id_user ? String(item.id_user) : '',
  })
  closeActionMenus()
  modalOpen.value = true
}

async function saveInventory() {
  formError.value = ''
  saving.value = true

  try {
    const payload = {
      name: itemForm.name.trim(),
      serial_number: itemForm.serial_number.trim(),
      id_category: Number(itemForm.id_category),
      status: itemForm.status,
      id_user: itemForm.id_user ? Number(itemForm.id_user) : null,
    }
    const editing = Boolean(editingItem.value)
    const path = editing ? `/inventaris/${editingItem.value.id}` : '/inventaris'

    await request(path, {
      method: editing ? 'PUT' : 'POST',
      token: token.value,
      body: payload,
    })
    modalOpen.value = false
    notice.value = editing ? 'Data inventaris berhasil diperbarui.' : 'Data inventaris berhasil ditambahkan.'
    await loadData()
  } catch (error) {
    formError.value = error.message
  } finally {
    saving.value = false
  }
}

async function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name) return

  formError.value = ''
  try {
    const response = await request('/categories', {
      method: 'POST',
      token: token.value,
      body: { name },
    })
    const category = response.category
    categories.value.push(category)
    itemForm.id_category = String(category.id_category)
    newCategoryName.value = ''
    showNewCategory.value = false
  } catch (error) {
    formError.value = error.message
  }
}

async function deleteInventory(item) {
  if (deletingInventoryId.value !== null) return
  const confirmed = window.confirm(`Hapus inventaris "${item.name}"?`)
  if (!confirmed) return

  pageError.value = ''
  deletingInventoryId.value = item.id
  try {
    await request(`/inventaris/${item.id}`, {
      method: 'DELETE',
      token: token.value,
    })
    notice.value = 'Data inventaris berhasil dihapus.'
    closeActionMenus()
    await loadData()
  } catch (error) {
    pageError.value = error.message
  } finally {
    deletingInventoryId.value = null
  }
}

function statusLabel(status) {
  const labels = {
    baik: 'Baik',
    rusak: 'Rusak',
    dilelang: 'Dilelang',
    'tidak di pakai': 'Tidak Dipakai',
  }
  return labels[status] || status || 'Belum diatur'
}

function statusClass(status) {
  return `status-${String(status || 'unknown').replace(/\s+/g, '-')}`
}

function inventoryId(id) {
  return `INV-${String(id).padStart(4, '0')}`
}

function memberDepartmentName(user) {
  return user.department?.name
    || departments.value.find((department) => department.id_departmans === user.id_departmans)?.name
    || '—'
}

function closeActionMenus() {
  activeMenuId.value = null
  activeMemberMenuId.value = null
  actionMenuType.value = ''
  actionMenuItem.value = null
}

function toggleActionMenu(event, type, item) {
  const id = type === 'inventory' ? item.id : item.id_user
  const isOpen = type === 'inventory'
    ? activeMenuId.value === id
    : activeMemberMenuId.value === id

  if (isOpen) {
    closeActionMenus()
    return
  }

  closeActionMenus()
  if (type === 'inventory') activeMenuId.value = id
  else activeMemberMenuId.value = id
  actionMenuType.value = type
  actionMenuItem.value = item

  const button = event.currentTarget.getBoundingClientRect()
  const menuWidth = 108
  const menuHeight = 80
  const left = Math.max(8, Math.min(button.right - menuWidth, window.innerWidth - menuWidth - 8))
  let top = button.bottom + 6
  if (top + menuHeight > window.innerHeight - 8) {
    top = Math.max(8, button.top - menuHeight - 6)
  }
  actionMenuPosition.value = { top, left }
}

function closeActionMenuOutsideClick(event) {
  if (!event.target.closest('.row-action-wrap, .row-menu')) {
    closeActionMenus()
  }
}

function showInventory() {
  currentPage.value = 'inventory'
}

function showMembers() {
  currentPage.value = 'members'
  loadMembers()
}

function openCreateMember() {
  editingMember.value = null
  formError.value = ''
  showNewDepartment.value = false
  newDepartmentName.value = ''
  Object.assign(memberForm, {
    username: '',
    password: '',
    id_departmans: departments.value[0]?.id_departmans?.toString() || '',
    position: '',
  })
  memberModalOpen.value = true
}

function openEditMember(user) {
  editingMember.value = user
  formError.value = ''
  showNewDepartment.value = false
  Object.assign(memberForm, {
    username: user.username || '',
    password: '',
    id_departmans: String(user.id_departmans || ''),
    position: user.position || '',
  })
  closeActionMenus()
  memberModalOpen.value = true
}

async function saveMember() {
  formError.value = ''
  memberSaving.value = true

  try {
    const payload = {
      username: memberForm.username.trim(),
      id_departmans: Number(memberForm.id_departmans),
      position: memberForm.position.trim(),
    }
    if (!editingMember.value || memberForm.password) {
      payload.password = memberForm.password
    }

    const editing = Boolean(editingMember.value)
    await request(editing ? `/users/${editingMember.value.id_user}` : '/register', {
      method: editing ? 'PUT' : 'POST',
      token: token.value,
      body: payload,
    })
    memberModalOpen.value = false
    notice.value = editing ? 'Data anggota berhasil diperbarui.' : 'Anggota berhasil ditambahkan.'
    await loadMembers()
  } catch (error) {
    formError.value = error.message
  } finally {
    memberSaving.value = false
  }
}

async function addDepartment() {
  const name = newDepartmentName.value.trim()
  if (!name) return

  formError.value = ''
  try {
    const response = await request('/departments', {
      method: 'POST',
      token: token.value,
      body: { name },
    })
    const department = response.department
    departments.value.push(department)
    memberForm.id_departmans = String(department.id_departmans)
    newDepartmentName.value = ''
    showNewDepartment.value = false
  } catch (error) {
    formError.value = error.message
  }
}

async function deleteMember(user) {
  if (deletingMemberId.value !== null) return
  const confirmed = window.confirm(`Hapus anggota "${user.username}"?`)
  if (!confirmed) return

  pageError.value = ''
  deletingMemberId.value = user.id_user
  try {
    await request(`/users/${user.id_user}`, {
      method: 'DELETE',
      token: token.value,
    })
    notice.value = 'Anggota berhasil dihapus.'
    closeActionMenus()
    await loadMembers()
  } catch (error) {
    pageError.value = error.message
  } finally {
    deletingMemberId.value = null
  }
}

function retryCurrentPage() {
  return currentPage.value === 'members' ? loadMembers() : loadData()
}

onMounted(() => {
  document.addEventListener('click', closeActionMenuOutsideClick)
  if (token.value) loadData()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeActionMenuOutsideClick)
})
</script>

<template>
  <div v-if="!token" class="login-page">
    <form class="login-card" @submit.prevent="login">
      <div class="brand login-brand">
        <span class="brand-mark">m</span>
        <span class="brand-name">manajemen<br><strong>inventaris.</strong></span>
      </div>
      <p class="eyebrow">SELAMAT DATANG</p>
      <h1>Masuk ke akun Anda</h1>
      <p class="login-description">Gunakan akun Anda untuk mengelola inventaris.</p>

      <label class="form-field">
        <span>Username</span>
        <input v-model="loginForm.username" autocomplete="username" required placeholder="Masukkan username">
      </label>
      <label class="form-field">
        <span>Password</span>
        <input v-model="loginForm.password" type="password" autocomplete="current-password" required placeholder="Masukkan password">
      </label>
      <p v-if="loginError" class="form-error">{{ loginError }}</p>
      <button class="primary-button login-submit" type="submit">Masuk</button>
      <p class="login-hint">Belum ada akun? Hubungi administrator untuk mendapatkan akses.</p>
    </form>
  </div>

  <div v-else class="app-shell" :class="{ 'dark-theme': darkTheme }">
    <aside class="sidebar">
      <button class="brand brand-button" type="button" @click="showInventory">
        <span class="brand-mark">m</span>
        <span class="brand-name">manajemen<br><strong>inventaris.</strong></span>
      </button>

      <nav class="side-navigation" aria-label="Navigasi utama">
        <button
          class="nav-item"
          :class="{ active: currentPage === 'inventory' }"
          type="button"
          @click="showInventory"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 9 1.5 1.5L12 8m2 1h2M8 15l1.5 1.5L12 14m2 1h2"/></svg>
          <span>Data Inventaris</span>
          <span v-if="currentPage === 'inventory'" class="active-dot"></span>
        </button>
        <button
          class="nav-item"
          :class="{ active: currentPage === 'members' }"
          type="button"
          @click="showMembers"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8m1 2.2a5 5 0 0 1 3.5 4.8"/></svg>
          <span>Management Anggota</span>
        </button>
        <button
          class="nav-item"
          :class="{ active: currentPage === 'analytics' }"
          type="button"
          @click="currentPage = 'analytics'"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="m7 15 3-3 2 2 4-5m0 0h-3m3 0v3"/></svg>
          <span>Analytics</span>
        </button>
      </nav>

      <div class="sidebar-bottom">
        <div class="profile-card">
          <div class="avatar">{{ (signedInUser.username || 'U').slice(0, 1).toUpperCase() }}</div>
          <div class="profile-copy">
            <strong>{{ signedInUser.username || 'Pengguna' }}</strong>
            <span>{{ signedInUser.id ? `ID Anggota ${signedInUser.id}` : 'Pengelola inventaris' }}</span>
          </div>
        </div>
        <button class="utility-link" type="button" :aria-pressed="darkTheme" @click="toggleDarkTheme">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/><path d="M17 3v3m-1.5-1.5h3"/></svg>
          <span>Dark Theme</span>
          <span class="toggle-track"><span></span></span>
        </button>
        <button class="utility-link" type="button" @click="logout()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="page-header">
        <div class="heading-copy">
          <p class="eyebrow">RUANG KERJA</p>
          <h1>{{ currentPage === 'inventory' ? 'Data Inventaris' : currentPage === 'analytics' ? 'Analytics' : 'Management Anggota' }}</h1>
        </div>

        <div v-if="currentPage === 'inventory'" class="header-actions">
          <label class="search-box">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4 4"/></svg>
            <input v-model="searchTerm" placeholder="Search Inventaris" aria-label="Cari inventaris">
            <button v-if="searchTerm" class="clear-search" type="button" aria-label="Hapus pencarian" @click="searchTerm = ''">×</button>
          </label>
          <div class="filter-wrap">
            <button class="filter-button" type="button" aria-label="Filter status" @click="filterOpen = !filterOpen">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 11h10m-7 5h4"/></svg>
            </button>
            <div v-if="filterOpen" class="filter-menu">
              <strong>Filter status</strong>
              <button
                v-for="option in [{ value: 'all', label: 'Semua status' }, { value: 'baik', label: 'Baik' }, { value: 'rusak', label: 'Rusak' }, { value: 'dilelang', label: 'Dilelang' }, { value: 'tidak di pakai', label: 'Tidak Dipakai' }]"
                :key="option.value"
                type="button"
                :class="{ selected: statusFilter === option.value }"
                @click="statusFilter = option.value; filterOpen = false"
              >{{ option.label }}</button>
            </div>
          </div>
          <button class="primary-button add-button" type="button" @click="openCreateModal">
            <span class="plus-icon">+</span>
            <span>Tambah Data</span>
          </button>
        </div>
        <div v-else-if="currentPage === 'members'" class="header-actions">
          <label class="search-box">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4 4"/></svg>
            <input v-model="memberSearchTerm" placeholder="Search Anggota" aria-label="Cari anggota">
            <button v-if="memberSearchTerm" class="clear-search" type="button" aria-label="Hapus pencarian anggota" @click="memberSearchTerm = ''">×</button>
          </label>
          <div class="filter-wrap">
            <button class="filter-button" type="button" aria-label="Filter departemen" @click="filterOpen = !filterOpen">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 11h10m-7 5h4"/></svg>
            </button>
            <div v-if="filterOpen" class="filter-menu">
              <strong>Filter departemen</strong>
              <button
                type="button"
                :class="{ selected: departmentFilter === 'all' }"
                @click="departmentFilter = 'all'; filterOpen = false"
              >Semua departemen</button>
              <button
                v-for="department in departments"
                :key="department.id_departmans"
                type="button"
                :class="{ selected: departmentFilter === String(department.id_departmans) }"
                @click="departmentFilter = String(department.id_departmans); filterOpen = false"
              >{{ department.name }}</button>
            </div>
          </div>
          <button class="primary-button add-button" type="button" @click="openCreateMember">
            <span class="plus-icon">+</span>
            <span>Tambah Anggota</span>
          </button>
        </div>
      </header>

      <div v-if="notice" class="notice-banner">
        <span>{{ notice }}</span>
        <button type="button" aria-label="Tutup notifikasi" @click="notice = ''">×</button>
      </div>
      <div v-if="pageError" class="error-banner">
        <span>{{ pageError }}</span>
        <button type="button" @click="retryCurrentPage">Coba lagi</button>
      </div>

      <section v-if="currentPage === 'inventory'" class="inventory-section">
        <div class="section-caption">
          <div>
            <h2>Daftar inventaris</h2>
            <p>Pantau dan kelola barang inventaris Anda.</p>
          </div>
          <span class="item-count">{{ filteredInventory.length }} item</span>
        </div>

        <div class="table-card">
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Inventaris ID</th>
                  <th>Barang</th>
                  <th>Type</th>
                  <th>Serial Number</th>
                  <th>Status</th>
                  <th>Assign</th>
                  <th>Department</th>
                  <th class="action-heading">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="9" class="empty-state">Memuat data inventaris...</td>
                </tr>
                <tr v-else-if="visibleInventory.length === 0">
                  <td colspan="9" class="empty-state">
                    {{ searchTerm || statusFilter !== 'all' ? 'Tidak ada inventaris yang cocok.' : 'Belum ada data inventaris. Tambahkan data pertama Anda.' }}
                  </td>
                </tr>
                <tr v-for="(item, index) in visibleInventory" v-else :key="item.id">
                  <td class="row-number">{{ (pageNumber - 1) * pageSize + index + 1 }}.</td>
                  <td><span class="inventory-code">{{ inventoryId(item.id) }}</span></td>
                  <td class="item-name">{{ item.name }}</td>
                  <td>{{ item.category?.name || '—' }}</td>
                  <td class="serial-number">{{ item.serial_number }}</td>
                  <td><span class="status-badge" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span></td>
                  <td><span v-if="item.user" class="assigned-badge">{{ item.user.username }}</span><span v-else class="muted-value">{{ item.id_user ? `User #${item.id_user}` : '—' }}</span></td>
                  <td>{{ item.user?.department?.name || '—' }}</td>
                  <td class="action-cell">
                    <div class="row-action-wrap">
                      <button
                        class="more-button"
                        type="button"
                        :aria-label="`Aksi untuk ${item.name}`"
                        @click="toggleActionMenu($event, 'inventory', item)"
                      >•••</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer class="table-footer">
            <div class="page-size-control">
              <span>Showing</span>
              <select v-model.number="pageSize" aria-label="Jumlah item per halaman">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
              </select>
              <span>items per page</span>
              <span v-if="filteredInventory.length" class="range-label">{{ firstVisibleItem }}–{{ lastVisibleItem }} of {{ filteredInventory.length }}</span>
            </div>
            <div class="pagination">
              <button type="button" :disabled="pageNumber === 1" @click="pageNumber--">Previous</button>
              <button
                v-for="page in totalPages"
                :key="page"
                type="button"
                class="page-number"
                :class="{ current: pageNumber === page }"
                @click="pageNumber = page"
              >{{ page }}</button>
              <button type="button" :disabled="pageNumber === totalPages" @click="pageNumber++">Next</button>
            </div>
          </footer>
        </div>
      </section>

      <section v-else-if="currentPage === 'analytics'" class="analytics-page">
        <div class="analytics-cards">
          <article v-for="status in analyticsStatuses" :key="status.key" class="analytics-stat-card">
            <div class="analytics-card-top">
              <span class="analytics-icon" :class="`analytics-icon-${status.key}`">
                <svg v-if="status.key === 'baik'" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 3.5V6h8V3.5M8 13l2.5 2.5L16 10"/></svg>
                <svg v-else-if="status.key === 'rusak'" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 4.7 3.8 16a2.1 2.1 0 0 0 1.8 3.1h13a2.1 2.1 0 0 0 1.8-3.1L13.9 4.7a2.1 2.1 0 0 0-3.6 0Z"/><path d="M12 9v4m0 3h.01"/></svg>
                <svg v-else-if="status.key === 'dilelang'" viewBox="0 0 24 24" aria-hidden="true"><path d="m20.6 13.4-7.2 7.2a2 2 0 0 1-2.8 0L3 13V4h9l8.6 6.6a2 2 0 0 1 0 2.8Z"/><circle cx="8" cy="8" r="1.3"/></svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></svg>
              </span>
              <span class="analytics-info" :title="`Jumlah barang dengan status ${status.label.toLowerCase()}`" aria-hidden="true">i</span>
            </div>
            <p>{{ status.label }}</p>
            <strong>{{ status.count }}</strong>
          </article>
        </div>

        <div class="analytics-chart">
          <svg
            viewBox="0 0 760 370"
            role="img"
            aria-label="Grafik jumlah inventaris berdasarkan status"
          >
            <g class="chart-grid">
              <g v-for="(tick, index) in analyticsChartTicks" :key="tick">
                <text x="38" :y="24 + index * 58" class="chart-axis-label">{{ tick }}</text>
                <line x1="52" x2="744" :y1="18 + index * 58" :y2="18 + index * 58" />
              </g>
              <line v-for="index in 5" :key="`vertical-${index}`" :x1="52 + index * 138.4" :x2="52 + index * 138.4" y1="18" y2="310" />
            </g>
            <line x1="52" x2="744" y1="310" y2="310" class="chart-baseline" />
            <g v-for="bar in analyticsBars" :key="bar.key">
              <rect
                :x="bar.x"
                :y="bar.y"
                width="100"
                :height="bar.height"
                rx="10"
                class="chart-bar"
              />
              <text :x="bar.center" y="345" class="chart-label">{{ bar.label }}</text>
            </g>
          </svg>
        </div>
      </section>

      <section v-else-if="currentPage === 'members'" class="members-section">
        <div class="table-card">
          <div class="table-scroll">
            <table class="members-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Jabatan</th>
                  <th>Department</th>
                  <th class="action-heading">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="membersLoading">
                  <td colspan="5" class="empty-state">Memuat data anggota...</td>
                </tr>
                <tr v-else-if="visibleUsers.length === 0">
                  <td colspan="5" class="empty-state">
                    {{ memberSearchTerm || departmentFilter !== 'all' ? 'Tidak ada anggota yang cocok.' : 'Belum ada data anggota.' }}
                  </td>
                </tr>
                <tr v-for="(user, index) in visibleUsers" v-else :key="user.id_user">
                  <td class="row-number">{{ (memberPageNumber - 1) * memberPageSize + index + 1 }}.</td>
                  <td class="item-name">{{ user.username }}</td>
                  <td>{{ user.position }}</td>
                  <td>{{ memberDepartmentName(user) }}</td>
                  <td class="action-cell">
                    <div class="row-action-wrap">
                      <button
                        class="more-button"
                        type="button"
                        :aria-label="`Aksi untuk ${user.username}`"
                        @click="toggleActionMenu($event, 'member', user)"
                      >•••</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer class="table-footer">
            <div class="page-size-control">
              <span>Showing</span>
              <select v-model.number="memberPageSize" aria-label="Jumlah anggota per halaman">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
              </select>
              <span>items per page</span>
              <span v-if="filteredUsers.length" class="range-label">{{ memberFirstVisible }}–{{ memberLastVisible }} of {{ filteredUsers.length }}</span>
            </div>
            <div class="pagination">
              <button type="button" :disabled="memberPageNumber === 1" @click="memberPageNumber--">Previous</button>
              <button
                v-for="page in memberTotalPages"
                :key="page"
                type="button"
                class="page-number"
                :class="{ current: memberPageNumber === page }"
                @click="memberPageNumber = page"
              >{{ page }}</button>
              <button type="button" :disabled="memberPageNumber === memberTotalPages" @click="memberPageNumber++">Next</button>
            </div>
          </footer>
        </div>
      </section>

      <section v-else class="secondary-page">
        <div class="unavailable-card">
          <span class="unavailable-icon">📊</span>
          <h2>Halaman tidak ditemukan</h2>
          <button class="text-button" type="button" @click="showInventory">Kembali ke data inventaris</button>
        </div>
      </section>
    </main>

    <Teleport to="body">
      <div
        v-if="actionMenuType === 'inventory' && actionMenuItem"
        class="row-menu row-menu-floating"
        role="menu"
        :style="{ top: `${actionMenuPosition.top}px`, left: `${actionMenuPosition.left}px` }"
      >
        <button type="button" role="menuitem" @click="openEditModal(actionMenuItem)">Edit</button>
        <button
          class="delete-action"
          type="button"
          role="menuitem"
          :disabled="deletingInventoryId !== null"
          @click="deleteInventory(actionMenuItem)"
        >{{ deletingInventoryId === actionMenuItem.id ? 'Menghapus...' : 'Hapus' }}</button>
      </div>
      <div
        v-else-if="actionMenuType === 'member' && actionMenuItem"
        class="row-menu row-menu-floating"
        role="menu"
        :style="{ top: `${actionMenuPosition.top}px`, left: `${actionMenuPosition.left}px` }"
      >
        <button type="button" role="menuitem" @click="openEditMember(actionMenuItem)">Edit</button>
        <button
          class="delete-action"
          type="button"
          role="menuitem"
          :disabled="deletingMemberId !== null"
          @click="deleteMember(actionMenuItem)"
        >{{ deletingMemberId === actionMenuItem.id_user ? 'Menghapus...' : 'Hapus' }}</button>
      </div>
    </Teleport>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false">
      <form class="modal-card" @submit.prevent="saveInventory">
        <div class="modal-heading">
          <div>
            <p class="eyebrow">{{ editingItem ? 'PERBARUI DATA' : 'DATA BARU' }}</p>
            <h2>{{ editingItem ? 'Edit Inventaris' : 'Tambah Inventaris' }}</h2>
          </div>
          <button class="close-button" type="button" aria-label="Tutup" @click="modalOpen = false">×</button>
        </div>

        <label class="form-field">
          <span>Nama barang</span>
          <input v-model="itemForm.name" required maxlength="100" placeholder="Contoh: Laptop Lenovo">
        </label>
        <label class="form-field">
          <span>Serial number</span>
          <input v-model="itemForm.serial_number" required maxlength="100" placeholder="Masukkan nomor seri">
        </label>
        <label class="form-field">
          <span>Kategori</span>
          <div class="category-input-row">
            <select v-model="itemForm.id_category" required>
              <option value="" disabled>Pilih kategori</option>
              <option v-for="category in categories" :key="category.id_category" :value="String(category.id_category)">
                {{ category.name }}
              </option>
            </select>
            <button class="outline-button" type="button" @click="showNewCategory = !showNewCategory">+ Kategori</button>
          </div>
        </label>
        <div v-if="showNewCategory" class="new-category-row">
          <input v-model="newCategoryName" placeholder="Nama kategori baru" @keydown.enter.prevent="addCategory">
          <button class="outline-button" type="button" @click="addCategory">Simpan</button>
        </div>
        <label class="form-field">
          <span>Status</span>
          <select v-model="itemForm.status" required>
            <option value="baik">Baik</option>
            <option value="rusak">Rusak</option>
            <option value="dilelang">Dilelang</option>
            <option value="tidak di pakai">Tidak Dipakai</option>
          </select>
        </label>
        <label class="form-field">
          <span>ID pengguna yang ditugaskan <small>(opsional)</small></span>
          <select v-model="itemForm.id_user">
            <option value="">Belum ditugaskan</option>
            <option v-for="user in users" :key="user.id_user" :value="String(user.id_user)">
              {{ user.username }} (ID: {{ user.id_user }})
            </option>
          </select>
        </label>

        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="modal-actions">
          <button class="outline-button" type="button" @click="modalOpen = false">Batal</button>
          <button class="primary-button" type="submit" :disabled="saving || !categories.length">
            {{ saving ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Simpan Data' }}
          </button>
        </div>
        <p v-if="!categories.length" class="category-hint">Tambahkan kategori terlebih dahulu untuk menyimpan inventaris.</p>
      </form>
    </div>

    <div v-if="memberModalOpen" class="modal-backdrop" @click.self="memberModalOpen = false">
      <form class="modal-card" @submit.prevent="saveMember">
        <div class="modal-heading">
          <div>
            <p class="eyebrow">{{ editingMember ? 'PERBARUI DATA' : 'DATA BARU' }}</p>
            <h2>{{ editingMember ? 'Edit Anggota' : 'Tambah Anggota' }}</h2>
          </div>
          <button class="close-button" type="button" aria-label="Tutup" @click="memberModalOpen = false">×</button>
        </div>

        <label class="form-field">
          <span>Nama</span>
          <input v-model="memberForm.username" required maxlength="100" placeholder="Nama anggota">
        </label>
        <label class="form-field">
          <span>Password <small v-if="editingMember">(kosongkan jika tidak diubah)</small></span>
          <input
            v-model="memberForm.password"
            :required="!editingMember"
            type="password"
            autocomplete="new-password"
            placeholder="Masukkan password"
          >
        </label>
        <label class="form-field">
          <span>Jabatan</span>
          <input v-model="memberForm.position" required maxlength="100" placeholder="Contoh: Staff IT">
        </label>
        <label class="form-field">
          <span>Department</span>
          <div class="category-input-row">
            <select v-model="memberForm.id_departmans" required>
              <option value="" disabled>Pilih department</option>
              <option v-for="department in departments" :key="department.id_departmans" :value="String(department.id_departmans)">
                {{ department.name }}
              </option>
            </select>
            <button class="outline-button" type="button" @click="showNewDepartment = !showNewDepartment">+ Department</button>
          </div>
        </label>
        <div v-if="showNewDepartment" class="new-category-row">
          <input v-model="newDepartmentName" placeholder="Nama department baru" @keydown.enter.prevent="addDepartment">
          <button class="outline-button" type="button" @click="addDepartment">Simpan</button>
        </div>

        <p v-if="formError" class="form-error">{{ formError }}</p>
        <div class="modal-actions">
          <button class="outline-button" type="button" @click="memberModalOpen = false">Batal</button>
          <button class="primary-button" type="submit" :disabled="memberSaving || !departments.length">
            {{ memberSaving ? 'Menyimpan...' : editingMember ? 'Simpan Perubahan' : 'Simpan Anggota' }}
          </button>
        </div>
        <p v-if="!departments.length" class="category-hint">Tambahkan department terlebih dahulu untuk menyimpan anggota.</p>
      </form>
    </div>
  </div>
</template>
