'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

const GROUP_LABELS = { market: '시장 유형', domain: '지식 영역', level: '경험 수준' };

function SortableCategoryItem({ id, category, onDelete }: { id: string, category: any, onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm mb-2">
      <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600 touch-none">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
      <span className="font-medium flex-1">{category.name}</span>
      <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">도서 {category._count?.books || 0}권</span>
      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(category.id)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const queryClient = useQueryClient();
  
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('market');
  const [newColor, setNewColor] = useState('#3B82F6');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const createMutation = useMutation({
    mutationFn: async (newCat: any) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewName('');
      toast.success('카테고리가 추가되었습니다.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('카테고리가 삭제되었습니다.');
    }
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const res = await fetch('/api/categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items)
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const handleDragEnd = (event: any, group: string) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const groupItems = categories.filter((c: any) => c.group === group);
      const oldIndex = groupItems.findIndex((i: any) => i.id === active.id);
      const newIndex = groupItems.findIndex((i: any) => i.id === over.id);
      
      const newItems = arrayMove(groupItems, oldIndex, newIndex);
      const updates = newItems.map((item: any, index: number) => ({ id: item.id, order: index }));
      
      reorderMutation.mutate(updates);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim(), group: newGroup, color: newColor });
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까? 연결된 도서의 카테고리 정보도 함께 삭제됩니다.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <><Header /><div className="p-10 text-center">Loading...</div></>;

  const grouped = {
    market: categories?.filter((c: any) => c.group === 'market') || [],
    domain: categories?.filter((c: any) => c.group === 'domain') || [],
    level: categories?.filter((c: any) => c.group === 'level') || [],
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 max-w-4xl py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-8">카테고리 관리</h1>
        
        <div className="bg-slate-50 p-6 rounded-xl border mb-10">
          <h2 className="text-lg font-semibold mb-4">새 카테고리 추가</h2>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">이름</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="카테고리명" required />
            </div>
            <div className="space-y-2 w-full sm:w-40">
              <label className="text-sm font-medium">그룹</label>
              <Select value={newGroup} onValueChange={(val) => val && setNewGroup(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">시장 유형</SelectItem>
                  <SelectItem value="domain">지식 영역</SelectItem>
                  <SelectItem value="level">경험 수준</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-full sm:w-24">
              <label className="text-sm font-medium">색상</label>
              <Input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-10 p-1 cursor-pointer" />
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={createMutation.isPending}>
              추가
            </Button>
          </form>
        </div>

        <div className="space-y-8">
          {Object.entries(GROUP_LABELS).map(([groupKey, groupName]) => (
            <div key={groupKey} className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">{groupName}</h3>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, groupKey)}>
                <SortableContext items={grouped[groupKey as keyof typeof grouped].map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
                  {grouped[groupKey as keyof typeof grouped].map((category: any) => (
                    <SortableCategoryItem key={category.id} id={category.id} category={category} onDelete={handleDelete} />
                  ))}
                  {grouped[groupKey as keyof typeof grouped].length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">카테고리가 없습니다.</p>
                  )}
                </SortableContext>
              </DndContext>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
