
import React, { useState, useMemo } from 'react';
import { Button, EmptyState, Input, Modal, Select, Textarea, ConfirmationModal } from '../components/Common';
import { ClipboardListIcon, GripVerticalIcon, PlusIcon, TrashIcon } from '../components/Icons';
import { KanbanBoard, KanbanCard, KanbanColumnType } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanSortableCardItemProps {
  card: KanbanCard;
  onEdit: (card: KanbanCard) => void;
  onDeleteInitiate: (cardId: string, cardTitle: string) => void;
}

const KanbanSortableCardItem: React.FC<KanbanSortableCardItemProps> = ({ card, onEdit, onDeleteInitiate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-white dark:bg-slate-700 p-3 rounded-md shadow-sm border border-slate-200 dark:border-slate-600"
    >
      <div className="flex justify-between items-start">
        <h5 className="font-medium text-slate-700 dark:text-slate-200 text-sm break-words w-[calc(100%-1.5rem)]">{card.title}</h5>
        <button {...listeners} aria-label="Drag card" className="cursor-grab active:cursor-grabbing p-1 -mr-1 -mt-1">
            <GripVerticalIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>
      </div>
      {card.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">{card.description}</p>}
      {card.dueDate && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Due: {new Date(card.dueDate).toLocaleDateString()}</p>}
      <div className="mt-2 flex space-x-1">
        <Button size="sm" variant="ghost" className="text-xs p-1" onClick={() => onEdit(card)}>Edit</Button>
        <Button size="sm" variant="ghost" className="text-xs p-1 text-red-500 dark:text-red-400" onClick={() => onDeleteInitiate(card.id, card.title)}>Delete</Button>
      </div>
    </div>
  );
};


const KanbanBoardPage: React.FC = () => {
  const [boards, setBoards] = useLocalStorage<KanbanBoard[]>('studyflow-kanbanBoards', []);
  const [cards, setCards] = useLocalStorage<KanbanCard[]>('studyflow-kanbanCards', []);
  const [selectedBoardId, setSelectedBoardId] = useLocalStorage<string | null>('studyflow-selectedKanbanBoardId', null);
  
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [currentCardForm, setCurrentCardForm] = useState<Partial<KanbanCard> & { targetColumn?: KanbanColumnType }>({});
  const [isEditingCard, setIsEditingCard] = useState(false);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null); // For drag overlay
  
  const [isConfirmDeleteBoardModalOpen, setIsConfirmDeleteBoardModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<{id: string, name: string} | null>(null);
  const [isConfirmDeleteCardModalOpen, setIsConfirmDeleteCardModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<{id: string, title: string} | null>(null);


  const selectedBoard = boards.find(b => b.id === selectedBoardId);
  const columns: KanbanColumnType[] = [KanbanColumnType.TODO, KanbanColumnType.IN_PROGRESS, KanbanColumnType.DONE];

  const cardsByColumn = useMemo(() => {
    const result: Record<KanbanColumnType, KanbanCard[]> = {
      [KanbanColumnType.TODO]: [],
      [KanbanColumnType.IN_PROGRESS]: [],
      [KanbanColumnType.DONE]: [],
    };
    cards.filter(card => card.boardId === selectedBoardId).forEach(card => {
      if (result[card.column]) {
        result[card.column].push(card);
      }
    });
    return result;
  }, [cards, selectedBoardId]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddBoard = () => {
    if (!newBoardName.trim()) return;
    const newBoard: KanbanBoard = {
      id: crypto.randomUUID(),
      name: newBoardName,
      userId: 'currentUser', 
      createdAt: new Date().toISOString(),
    };
    setBoards(prev => [...prev, newBoard]);
    if (!selectedBoardId) setSelectedBoardId(newBoard.id);
    setNewBoardName('');
    setIsBoardModalOpen(false);
  };
  
  const handleDeleteBoardInitiate = (boardId: string, boardName: string) => {
    setBoardToDelete({ id: boardId, name: boardName });
    setIsConfirmDeleteBoardModalOpen(true);
  };

  const confirmDeleteBoard = () => {
    if (boardToDelete) {
      setBoards(prev => prev.filter(board => board.id !== boardToDelete.id));
      setCards(prev => prev.filter(card => card.boardId !== boardToDelete.id));
      if (selectedBoardId === boardToDelete.id) {
        setSelectedBoardId(boards.length > 1 ? boards.find(board => board.id !== boardToDelete.id)!.id : null);
      }
    }
    setIsConfirmDeleteBoardModalOpen(false);
    setBoardToDelete(null);
  };


  const openCardModal = (targetColumn?: KanbanColumnType, cardToEdit?: KanbanCard) => {
    if (cardToEdit) {
      setCurrentCardForm(cardToEdit);
      setIsEditingCard(true);
    } else {
      setCurrentCardForm({ targetColumn: targetColumn || KanbanColumnType.TODO, boardId: selectedBoardId! });
      setIsEditingCard(false);
    }
    setIsCardModalOpen(true);
  };

  const handleSaveCard = () => {
    if (!currentCardForm.title?.trim() || !selectedBoardId) return;

    if (isEditingCard && currentCardForm.id) {
      setCards(prev => prev.map(c => c.id === currentCardForm.id ? {...c, ...currentCardForm} as KanbanCard : c));
    } else {
      const newCard: KanbanCard = {
        id: crypto.randomUUID(),
        title: currentCardForm.title!,
        description: currentCardForm.description,
        dueDate: currentCardForm.dueDate,
        column: currentCardForm.targetColumn || currentCardForm.column || KanbanColumnType.TODO,
        boardId: selectedBoardId,
        createdAt: new Date().toISOString(),
      };
      setCards(prev => [...prev, newCard]);
    }
    setIsCardModalOpen(false);
    setCurrentCardForm({});
  };
  
  const handleDeleteCardInitiate = (cardId: string, cardTitle: string) => {
    setCardToDelete({ id: cardId, title: cardTitle });
    setIsConfirmDeleteCardModalOpen(true);
  };

  const confirmDeleteCard = () => {
    if (cardToDelete) {
      setCards(prev => prev.filter(c => c.id !== cardToDelete.id));
    }
    setIsConfirmDeleteCardModalOpen(false);
    setCardToDelete(null);
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeCard = cards.find(c => c.id === activeId);
    if (!activeCard) return;

    // Check if 'over' is a column or a card
    const overIsColumn = columns.includes(overId as KanbanColumnType);

    setCards((currentCards) => {
      const activeIndex = currentCards.findIndex(c => c.id === activeId);
      
      if (overIsColumn) { // Dropped onto a column
        const newColumn = overId as KanbanColumnType;
        if (activeCard.column !== newColumn) {
          // Move to new column (typically at the end or based on drop position)
          const updatedCard = { ...currentCards[activeIndex], column: newColumn };
          let reorderedCards = currentCards.filter(c => c.id !== activeId);
          reorderedCards.push(updatedCard); // Simplistic: add to end of conceptual list before filtering by column
          // A more precise insertion would require knowing the exact drop position relative to other cards in the new column.
          // For now, this updates the column, and SortableContext will handle visual ordering.
          return reorderedCards.map(c => c.id === activeId ? updatedCard : c);
        }
        return currentCards; // No change if dropped on its own column header
      } else { // Dropped onto another card
        const overIndex = currentCards.findIndex(c => c.id === overId);
        if (overIndex === -1) return currentCards;

        const overCard = currentCards[overIndex];

        if (activeCard.column === overCard.column) {
          // Reorder within the same column
          return arrayMove(currentCards, activeIndex, overIndex);
        } else {
          // Move to new column and reorder
          const updatedCard = { ...currentCards[activeIndex], column: overCard.column };
          const cardsInNewColumn = currentCards.filter(c => c.column === overCard.column && c.id !== activeId);
          const targetIndexInNewCol = cardsInNewColumn.findIndex(c => c.id === overId);

          const reorderedNewCol = arrayMove(cardsInNewColumn, -1, targetIndexInNewCol); // placeholder for insert
          
          let finalCards = currentCards.filter(c => c.id !== activeId && c.column !== overCard.column);
          finalCards = finalCards.concat(currentCards.filter(c => c.column === overCard.column && c.id !== activeId && c.id !== overId));
          
          let insertAtIndex = finalCards.findIndex(c=> c.id === overId);
          if(insertAtIndex === -1) insertAtIndex = finalCards.filter(c=>c.column === overCard.column).length;
          else { // if dropping before overId, then insertAtIndex, else insertAtIndex+1
             // This logic is tricky without knowing exact drop point relative to overCard (top/bottom half)
             // Simplification: insert near overCard
          }

          finalCards.splice(insertAtIndex, 0, updatedCard);
          return finalCards.map(c => c.id === activeId ? updatedCard : c); // Ensure updatedCard is in the list

        }
      }
    });
  }
  
  const activeDraggedCard = useMemo(() => cards.find(c => c.id === activeId), [activeId, cards]);


  if (boards.length === 0 && !isBoardModalOpen) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Kanban Boards</h2>
        <EmptyState
          title="No Kanban Boards Yet"
          message="Create your first board to organize your projects or study tasks."
          icon={<ClipboardListIcon className="w-16 h-16 text-slate-400 dark:text-slate-500" />}
          action={
            <Button onClick={() => setIsBoardModalOpen(true)} variant="primary">
              <PlusIcon className="w-4 h-4 mr-2" /> Create New Board
            </Button>
          }
        />
        <Modal isOpen={isBoardModalOpen} onClose={() => setIsBoardModalOpen(false)} title="Create New Board">
          <Input label="Board Name" value={newBoardName} onChange={e => setNewBoardName(e.target.value)} placeholder="e.g., Project Phoenix" />
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAddBoard} variant="primary">Create Board</Button>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Kanban Board:</h2>
            {boards.length > 0 && (
              <Select 
                value={selectedBoardId || ''} 
                onChange={e => setSelectedBoardId(e.target.value)}
                className="p-2 text-lg font-medium dark:bg-slate-700 dark:border-slate-600"
                aria-label="Select Kanban Board"
              >
                {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            )}
          </div>
          <Button onClick={() => setIsBoardModalOpen(true)} variant="ghost">
            <PlusIcon className="w-4 h-4 mr-2" /> Manage Boards
          </Button>
        </div>

        {!selectedBoard && boards.length > 0 && <p className="text-slate-600 dark:text-slate-300">Select or create a board to get started.</p>}

        {selectedBoard && (
          <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4">
            {columns.map(columnType => (
              <SortableContext key={columnType} items={cardsByColumn[columnType].map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div 
                  id={columnType}
                  className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg shadow-inner min-h-[300px] flex flex-col"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{columnType} ({cardsByColumn[columnType].length})</h3>
                    <Button size="sm" variant="ghost" onClick={() => openCardModal(columnType)} aria-label={`Add card to ${columnType}`}>
                      <PlusIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                    {cardsByColumn[columnType].map(card => (
                      <KanbanSortableCardItem 
                        key={card.id} 
                        card={card} 
                        onEdit={() => openCardModal(undefined, card)} 
                        onDeleteInitiate={handleDeleteCardInitiate}
                      />
                    ))}
                    {cardsByColumn[columnType].length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No cards here yet.</p>}
                  </div>
                </div>
              </SortableContext>
            ))}
          </div>
        )}
        <DragOverlay>
            {activeId && activeDraggedCard ? (
                 <div className="bg-white dark:bg-slate-700 p-3 rounded-md shadow-lg border border-slate-200 dark:border-slate-600 opacity-90">
                    <h5 className="font-medium text-slate-700 dark:text-slate-200 text-sm">{activeDraggedCard.title}</h5>
                    {activeDraggedCard.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activeDraggedCard.description}</p>}
                 </div>
            ) : null}
        </DragOverlay>


        <Modal isOpen={isBoardModalOpen} onClose={() => setIsBoardModalOpen(false)} title="Manage Boards" size="md">
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-2 text-slate-700 dark:text-slate-200">Existing Boards:</h4>
            {boards.length > 0 ? (
              <ul className="space-y-1 max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md p-2">
                {boards.map(b => (
                  <li key={b.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                    <span className="text-slate-700 dark:text-slate-200">{b.name}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDeleteBoardInitiate(b.id, b.name)}
                    >
                      <TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400"/>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500 dark:text-slate-400">No boards created yet.</p>}
          </div>
          <hr className="my-4 border-slate-200 dark:border-slate-700"/>
          <h4 className="text-md font-semibold mb-2 text-slate-700 dark:text-slate-200">Create New Board:</h4>
          <Input label="Board Name" value={newBoardName} onChange={e => setNewBoardName(e.target.value)} placeholder="e.g., Thesis Work" />
          <div className="mt-6 flex justify-end">
            <Button onClick={handleAddBoard} variant="primary">Create Board</Button>
          </div>
        </Modal>

        <Modal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} title={isEditingCard ? "Edit Card" : "Add New Card"}>
          <div className="space-y-3">
            <Input 
              label="Title" 
              value={currentCardForm.title || ''} 
              onChange={e => setCurrentCardForm(prev => ({ ...prev, title: e.target.value }))} 
              required 
            />
            <Textarea 
              label="Description (Optional)" 
              value={currentCardForm.description || ''} 
              onChange={e => setCurrentCardForm(prev => ({ ...prev, description: e.target.value }))} 
            />
            <Input 
              label="Due Date (Optional)" 
              type="date" 
              value={currentCardForm.dueDate ? currentCardForm.dueDate.split('T')[0] : ''} 
              onChange={e => setCurrentCardForm(prev => ({ ...prev, dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} 
            />
            {!isEditingCard && (
              <Select
                label="Column"
                id="cardColumn"
                value={currentCardForm.targetColumn || currentCardForm.column || KanbanColumnType.TODO}
                onChange={e => setCurrentCardForm(prev => ({ ...prev, targetColumn: e.target.value as KanbanColumnType}))}
              >
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </Select>
            )}
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setIsCardModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveCard}>{isEditingCard ? "Save Changes" : "Add Card"}</Button>
            </div>
          </div>
        </Modal>
        
        <ConfirmationModal
            isOpen={isConfirmDeleteBoardModalOpen}
            onClose={() => setIsConfirmDeleteBoardModalOpen(false)}
            onConfirm={confirmDeleteBoard}
            title="Delete Board"
            message={<p>Are you sure you want to delete the board "<strong>{boardToDelete?.name}</strong>" and all its cards? This action cannot be undone.</p>}
        />
        <ConfirmationModal
            isOpen={isConfirmDeleteCardModalOpen}
            onClose={() => setIsConfirmDeleteCardModalOpen(false)}
            onConfirm={confirmDeleteCard}
            title="Delete Card"
            message={<p>Are you sure you want to delete the card "<strong>{cardToDelete?.title}</strong>"? This action cannot be undone.</p>}
        />

      </div>
    </DndContext>
  );
};

export default KanbanBoardPage;
