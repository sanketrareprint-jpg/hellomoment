'use client';

import {
  OCCASION_LABELS,
  TEMPLATE_OCCASIONS,
  VARIABLE_SOURCE_LABELS,
  renderPreview,
  syncVariablesWithBody,
  type MessageTemplateOccasion,
  type MessageVariable,
  type MessageVariableSource,
} from '@/lib/messageTemplateVars';

export interface MessageTemplateDraft {
  name: string;
  occasion: MessageTemplateOccasion;
  body: string;
  variables: MessageVariable[];
}

/**
 * Shared name/occasion/body/variables editor for message templates — used
 * by admin (general/special templates) and by businesses (their own custom
 * template). Every {{n}} typed in the body gets a row to name it, pick where
 * its value comes from, and give an example value; a live preview shows the
 * message as a contact would read it.
 */
export default function MessageTemplateEditor({
  value,
  onChange,
  allowedSources,
}: {
  value: MessageTemplateDraft;
  onChange: (next: MessageTemplateDraft) => void;
  allowedSources?: MessageVariableSource[];
}) {
  const sources = allowedSources ?? (Object.keys(VARIABLE_SOURCE_LABELS) as MessageVariableSource[]);

  function setBody(body: string) {
    onChange({ ...value, body, variables: syncVariablesWithBody(body, value.variables) });
  }

  function setVariable(index: number, patch: Partial<MessageVariable>) {
    onChange({ ...value, variables: value.variables.map((v) => (v.index === index ? { ...v, ...patch } : v)) });
  }

  function insertNextVariable() {
    const next = value.variables.length + 1;
    setBody(`${value.body}{{${next}}}`);
  }

  const sampleValues = Object.fromEntries(value.variables.map((v) => [String(v.index), v.sample ?? '']));

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Template name</label>
          <input
            className="input"
            required
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="e.g. Festive offer"
          />
        </div>
        <div>
          <label className="label">Occasion</label>
          <select
            className="input"
            value={value.occasion}
            onChange={(e) => onChange({ ...value, occasion: e.target.value as MessageTemplateOccasion })}
          >
            {TEMPLATE_OCCASIONS.map((o) => (
              <option key={o} value={o}>
                {OCCASION_LABELS[o]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label mb-0">Message text</label>
          <button type="button" onClick={insertNextVariable} className="text-xs font-medium text-brand-600 hover:underline">
            + Insert variable {`{{${value.variables.length + 1}}}`}
          </button>
        </div>
        <textarea
          className="input font-mono"
          rows={5}
          required
          value={value.body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={'Hi {{1}}, happy {{2}}! Enjoy {{3}} on your next visit. — {{4}}'}
        />
        <p className="text-xs text-gray-500 mt-1">
          Use {'{{1}}'}, {'{{2}}'}, {'{{3}}'}… for the parts that change. WhatsApp formatting like *bold* works. The
          flyer is sent as the image above this text.
        </p>
      </div>

      {value.variables.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Variables</div>
          {value.variables.map((v) => (
            <div key={v.index} className="grid grid-cols-1 sm:grid-cols-[3rem_1fr_1fr_1fr] gap-2 items-center">
              <span className="text-sm font-mono text-gray-500">{`{{${v.index}}}`}</span>
              <input
                className="input"
                value={v.label}
                onChange={(e) => setVariable(v.index, { label: e.target.value })}
                placeholder="Name, e.g. Offer"
              />
              <select
                className="input"
                value={v.source}
                onChange={(e) => setVariable(v.index, { source: e.target.value as MessageVariableSource })}
              >
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {VARIABLE_SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
              <input
                className="input"
                value={v.sample ?? ''}
                onChange={(e) => setVariable(v.index, { sample: e.target.value })}
                placeholder="Example value"
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="text-sm font-medium text-gray-700 mb-1">Preview</div>
        <div className="rounded-xl bg-[#e7ffdb] border border-green-200 px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
          {value.body ? renderPreview(value.body, value.variables, sampleValues) : 'Your message will appear here.'}
        </div>
      </div>
    </div>
  );
}
