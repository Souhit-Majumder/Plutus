import { useState } from 'react'
import { Plus, Pencil, Trash2, Tag, Layers, CreditCard } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { LoadingOverlay, ErrorBox } from '../components/ui'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useFetch } from '../hooks/useFetch'
import { categoryService, tagService, paymentMethodService } from '../services/api'

// ── Generic CRUD table used for all three tabs ─────────────────────────────
function CrudTable({ items, loading, refetch, service, labelKey, idKey, placeholder, title }) {
  const [addModal, setAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formVal, setFormVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!formVal.trim()) return
    setSaving(true); setError('')
    try {
      const payload = { [labelKey]: formVal.trim() }
      if (editTarget) await service.update(editTarget.id, payload)
      else await service.create(payload)
      setAddModal(false); setEditTarget(null); setFormVal(''); refetch()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try { await service.delete(deleteTarget[idKey]); setDeleteTarget(null); refetch() }
    catch (e) { setError(e.response?.data?.detail || 'Cannot delete') }
    finally { setSaving(false) }
  }

  const openEdit = (item) => { setEditTarget(item); setFormVal(item[labelKey]); setAddModal(true) }
  const openAdd  = () => { setEditTarget(null); setFormVal(''); setAddModal(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{(items || []).length} {title[0].toLowerCase()}</p>
        <button onClick={openAdd} className="btn-primary"><Plus size={14} /> Add {title[1]}</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingOverlay /> : (items || []).length === 0 ? (
          <EmptyState icon={Layers} title={`No ${title[0].toLowerCase()} yet`}
            desc={`Add your first ${title[0].toLowerCase().slice(0, -1)} to get started.`} />
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map(item => (
                <tr key={item.id} className="table-tr">
                  <td className="table-td font-medium text-slate-800">{item[labelKey]}</td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setEditTarget(null); setError('') }}
        title={editTarget ? `Edit ${title[1]}` : `Add ${title[1]}`} size="sm">
        <div className="space-y-4">
          <ErrorBox message={error} />
          <div>
            <label className="label">Name *</label>
            <input className="input" placeholder={placeholder} value={formVal}
              onChange={e => setFormVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setAddModal(false); setEditTarget(null) }} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving || !formVal.trim()} className="btn-primary">
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={`Delete ${title[1]}`} size="sm">
        <ErrorBox message={error} />
        <p className="text-sm text-slate-600 mb-4">
          Delete <span className="font-semibold">"{deleteTarget?.[labelKey]}"</span>? This may affect linked records.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} disabled={saving} className="btn-danger">
            {saving ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ── Main page with tabs ────────────────────────────────────────────────────
const TABS = [
  { key: 'categories',     label: ['Categories', 'Category'],             icon: Layers,     service: categoryService,     labelKey: 'category_name', ph: 'e.g. Food, Travel…', idKey: 'category_id' },
  { key: 'tags',           label: ['Tags', 'Tag'],                        icon: Tag,        service: tagService,          labelKey: 'tag_name',      ph: 'e.g. monthly, urgent…', idKey: 'tag_id' },
  { key: 'payment_methods',label: ['Payment Methods', 'Payment Method'],  icon: CreditCard, service: paymentMethodService, labelKey: 'method_name',   ph: 'e.g. UPI, Cash…', idKey: 'payment_method_id' },
]

export default function ManageDataPage() {
  const [activeTab, setActiveTab] = useState('categories')
  const tab = TABS.find(t => t.key === activeTab)

  const { data, loading, refetch } = useFetch(tab.service.list, [activeTab])

  return (
    <div>
      <PageHeader title="Manage Data" subtitle="Organise your categories, tags and payment methods" />

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon size={14} /> {t.label[0]}
          </button>
        ))}
      </div>

      <CrudTable
        key={activeTab}
        items={data}
        loading={loading}
        refetch={refetch}
        service={tab.service}
        labelKey={tab.labelKey}
        idKey={tab.idKey}
        placeholder={tab.ph}
        title={tab.label}
      />
    </div>
  )
}
