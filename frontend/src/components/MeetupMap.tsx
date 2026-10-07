import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Meetup, SharedLocation } from "../lib/api";

interface Props {
  loc: SharedLocation;
  meetup: Meetup | null;
  draft: { lat: number; lng: number } | null;
  picking: boolean;
  onPick: (p: { lat: number; lng: number }) => void;
}

const pin = (variant: string) =>
  L.divIcon({ className: "", html: `<span class="cm-pin cm-pin--${variant}"></span>`, iconSize: [28, 36], iconAnchor: [14, 34] });

const ICONS = { proposed: pin("proposed"), accepted: pin("accepted"), declined: pin("declined"), draft: pin("draft") };

function ClickCatcher({ enabled, onPick }: { enabled: boolean; onPick: Props["onPick"] }) {
  useMapEvents({
    click(e) {
      if (enabled) onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function MeetupMap({ loc, meetup, draft, picking, onPick }: Props) {
  return (
    <div className={`relative z-0 h-64 overflow-hidden sm:h-72 ${picking ? "cursor-crosshair" : ""}`} data-testid="meetup-map">
      <MapContainer center={[loc.lat, loc.lng]} zoom={14} scrollWheelZoom={false} className="h-full w-full bg-[#0e1016]">
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Circle
          center={[loc.lat, loc.lng]}
          radius={loc.accuracy_m ?? 1000}
          pathOptions={{ color: "#34d399", weight: 1.5, fillColor: "#34d399", fillOpacity: 0.12, dashArray: "4 6" }}
        />
        {meetup && !draft && <Marker position={[meetup.lat, meetup.lng]} icon={ICONS[meetup.status]} />}
        {draft && <Marker position={[draft.lat, draft.lng]} icon={ICONS.draft} />}
        <ClickCatcher enabled={picking} onPick={onPick} />
      </MapContainer>
      {picking && (
        <span className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full bg-[#07080c]/90 px-4 py-2 text-xs font-medium text-white ring-1 ring-white/15">
          Tap the map to drop a pin
        </span>
      )}
    </div>
  );
}
