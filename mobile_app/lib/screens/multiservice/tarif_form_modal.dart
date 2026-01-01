import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/theme.dart';
import '../../models/multiservice_models.dart';
import '../../models/produit_models.dart';
import '../../services/multiservice_service.dart';
import '../../services/produit_service.dart';
import '../../widgets/modal_components.dart';

class TarifFormModal extends StatefulWidget {
  final TarifService? tarif;
  final VoidCallback onSuccess;

  const TarifFormModal({super.key, this.tarif, required this.onSuccess});

  @override
  State<TarifFormModal> createState() => _TarifFormModalState();
}

class _TarifFormModalState extends State<TarifFormModal> {
  final _formKey = GlobalKey<FormState>();
  final _nomController = TextEditingController();
  final _prixController = TextEditingController();
  final _descController = TextEditingController();

  String _selectedCategorie = 'MULTISERVICE';
  String _selectedUnite = 'page';
  bool _actif = true;
  List<Map<String, dynamic>> _consommations = [];

  List<Produit> _produits = [];
  bool _loadingProduits = true;
  bool _submitting = false;

  final List<Map<String, String>> _categories = [
    {'value': 'INTERNET', 'label': 'Services Internet'},
    {'value': 'MULTISERVICE', 'label': 'Multiservices'},
    {'value': 'VENTE', 'label': 'Vente de produits'},
    {'value': 'AUTRE', 'label': 'Autres services'},
  ];

  final List<Map<String, String>> _unites = [
    {'value': 'heure', 'label': 'Heure'},
    {'value': 'page', 'label': 'Page'},
    {'value': 'document', 'label': 'Document'},
    {'value': 'pièce', 'label': 'Pièce'},
    {'value': 'unité', 'label': 'Unité'},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.tarif != null) {
      _nomController.text = widget.tarif!.nomService;
      _prixController.text = widget.tarif!.prixUnitaire.toStringAsFixed(0);
      _descController.text = widget.tarif!.description ?? '';
      _selectedCategorie = widget.tarif!.categorie ?? 'MULTISERVICE';
      _selectedUnite = widget.tarif!.uniteMesure ?? 'page';
      _actif = widget.tarif!.actif;
      _consommations = widget.tarif!.consommations
          .map((c) => {'produit_id': c.produitId, 'quantite': c.quantite})
          .toList();
    }
    _loadProduits();
  }

  Future<void> _loadProduits() async {
    // On récupère tout mais on trie pour mettre les actifs en haut
    final result = await produitService.getProduits();
    if (mounted) {
      setState(() {
        _loadingProduits = false;
        if (result.success) {
          _produits = result.produits;
          // Tri : Actifs d'abord, puis alphabétique
          _produits.sort((a, b) {
            if (a.actif && !b.actif) return -1;
            if (!a.actif && b.actif) return 1;
            return a.designation.toLowerCase().compareTo(
              b.designation.toLowerCase(),
            );
          });
        } else {
          showModernSnackBar(
            context,
            message: 'Erreur produits: ${result.error}',
            type: SnackBarType.error,
          );
        }
      });
    }
  }

  void _addConsommation() {
    if (_produits.isEmpty) {
      showModernSnackBar(
        context,
        message: 'Aucun produit actif disponible',
        type: SnackBarType.error,
      );
      return;
    }
    setState(() {
      _consommations = List.from(_consommations)
        ..add({'produit_id': _produits.first.id, 'quantite': 1.0});
    });
  }

  void _removeConsommation(int index) {
    setState(() {
      _consommations = List.from(_consommations)..removeAt(index);
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);

    final payload = {
      'nom_service': _nomController.text.trim(),
      'categorie': _selectedCategorie,
      'prix_unitaire': double.tryParse(_prixController.text) ?? 0,
      'unite_mesure': _selectedUnite,
      'description': _descController.text.trim(),
      'actif': _actif,
      'consommations_write': _consommations,
    };

    final success = widget.tarif != null
        ? await multiserviceService.updateTarif(widget.tarif!.id, payload)
        : await multiserviceService.createTarif(payload);

    if (mounted) {
      setState(() => _submitting = false);
      if (success) {
        Navigator.pop(context);
        showModernSnackBar(
          context,
          message: widget.tarif != null ? 'Tarif modifié !' : 'Tarif créé !',
          type: SnackBarType.success,
        );
        widget.onSuccess();
      } else {
        showModernSnackBar(
          context,
          message: 'Une erreur est survenue',
          type: SnackBarType.error,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ModernModal(
      title: widget.tarif != null ? 'Modifier le Tarif' : 'Nouveau Tarif',
      footer: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _submitting ? null : _submit,
          child: _submitting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const Text('ENREGISTRER'),
        ),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ModernTextField(
                controller: _nomController,
                label: 'Nom du service *',
                hint: 'Ex: Impression N&B',
                validator: (v) => (v?.isEmpty ?? true) ? 'Requis' : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ModernDropdown<String>(
                      label: 'Catégorie *',
                      value: _selectedCategorie,
                      hint: 'Sélectionner',
                      items: _categories.map((c) {
                        return DropdownMenuItem(
                          value: c['value']!,
                          child: Text(c['label']!),
                        );
                      }).toList(),
                      onChanged: (v) => setState(() => _selectedCategorie = v!),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ModernTextField(
                      controller: _prixController,
                      label: 'Prix Unitaire (Ar) *',
                      hint: '0',
                      keyboardType: TextInputType.number,
                      validator: (v) => (v?.isEmpty ?? true) ? 'Requis' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ModernDropdown<String>(
                label: 'Unité de mesure *',
                value: _selectedUnite,
                hint: 'Sélectionner',
                items: _unites.map((u) {
                  return DropdownMenuItem(
                    value: u['value']!,
                    child: Text(u['label']!),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _selectedUnite = v!),
              ),
              const SizedBox(height: 12),
              ModernTextField(
                controller: _descController,
                label: 'Description',
                hint: 'Détails optionnels',
                maxLines: 2,
              ),
              const SizedBox(height: 24),

              // Recette (Consommations)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Recette (Produits consommés)',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  if (_loadingProduits)
                    const SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  children: [
                    if (_consommations.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        child: Column(
                          children: [
                            Icon(
                              Icons.inventory_2_outlined,
                              size: 32,
                              color: Colors.grey.shade300,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Aucun produit pour ce service',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ...List.generate(_consommations.length, (index) {
                      final conso = _consommations[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Expanded(
                              flex: 3,
                              child: ModernDropdown<int>(
                                label: index == 0 ? 'Produit' : '',
                                hint: 'Produit',
                                value: conso['produit_id'],
                                items: _produits.map((p) {
                                  return DropdownMenuItem(
                                    value: p.id,
                                    child: Text(
                                      p.designation,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  );
                                }).toList(),
                                onChanged: (v) {
                                  setState(() {
                                    _consommations[index]['produit_id'] = v;
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              flex: 1,
                              child: ModernTextField(
                                label: index == 0 ? 'Qté' : '',
                                hint: '1',
                                initialValue: conso['quantite'].toString(),
                                keyboardType:
                                    const TextInputType.numberWithOptions(
                                      decimal: true,
                                    ),
                                onChanged: (v) {
                                  _consommations[index]['quantite'] =
                                      double.tryParse(v) ?? 1.0;
                                },
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: IconButton(
                                icon: const Icon(
                                  Icons.remove_circle_outline,
                                  color: AppTheme.error,
                                  size: 20,
                                ),
                                onPressed: () => _removeConsommation(index),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: TextButton.icon(
                        onPressed: _loadingProduits ? null : _addConsommation,
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('AJOUTER UN PRODUIT'),
                        style: TextButton.styleFrom(
                          foregroundColor: AppTheme.primaryBlue,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Switch(
                    value: _actif,
                    onChanged: (v) => setState(() => _actif = v),
                    activeThumbColor: AppTheme.primaryBlue,
                    activeTrackColor: AppTheme.primaryBlue.withValues(
                      alpha: 0.5,
                    ),
                  ),
                  const Text('Service actif'),
                ],
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}
