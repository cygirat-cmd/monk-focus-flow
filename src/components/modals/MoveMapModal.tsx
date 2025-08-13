import WorldMap from '@/pages/WorldMap';

type Props = { open: boolean; onClose: () => void };

export default function MoveMapModal({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80">
      <WorldMap onDone={onClose} />
    </div>
  );
}

